Vue.component('view-teams', {
  data: () => ({
    page: 1,
  }),
  props: [ 'value', 'snack' ],
  methods: {
    randTeams () {
      for (let i = 0; i < 9; ++i) {
        this.value.push(randomTeam());
      }
    },
    addTeam () {
      this.$emit('input', [...this.value, emptyTeam()]);
      this.$nextTick(() => {
        this.page = this.value.length;
      });
    },
    deleteTeam () {
      if (this.value.length > 0) {
        const idx = this.page-1;
        if (idx != null) {
          const teams = [...this.value.slice(0, idx), ...this.value.slice(idx+1)];
          this.$emit('input', teams);
        }
      }
    },
    onImport (text) {
      const {data, errors, meta} = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        fastMode: false,
        comments: '#',
      });
      if (errors.length > 0) {
        errors.map(x => console.log(`error: ${JSON.stringify(x)}`));
        this.$emit('update:snack', {
          visible: true,
          color: 'error',
          items: [errors.map(JSON.stringify)],
        });
      } else {
        let missing = [];
        const expected = ['name1', 'mail1', 'phone1',
          'name2', 'mail2', 'phone2', 'address', 'comments'];
        for (let i = 0; i < expected.length; ++i) {
          if (!meta.fields.includes(expected[i])) {
            missing.push(expected[i]);
          }
        }
        if (missing.length > 0) {
          console.log('missing fields: ' + missing.join(', '));
          this.$emit('update:snack', {
            visible: true,
            color: 'warning',
            items: ['Missing fields: ' + missing.join(', ')],
          });
        }
        let teams = [];
        for (let i = 0; i < data.length; ++i) {
          teams.push(cleanTeam(data[i]));
        }
        this.$emit('input', teams);
      }
    },
    onExport (text) {
      chunks = [];
      chunks.push('"name1","mail1","phone1","name2","mail2","phone2","address","comments","coords"\n');
      this.value.forEach((team) => {
        chunks.push(`"${team.name1}","${team.mail1}","${team.phone1}",`);
        chunks.push(`"${team.name2}","${team.mail2}","${team.phone2}",`);
        chunks.push(`"${team.address}","${team.comments}","${team.coords}"\n`);
      });
      downloadFile('teams.csv', chunks.join(''));
    },
    onSearch(item) {
      if (item != null) {
        this.page = item + 1;
      }
    },
  },
  beforeUpdate() {
    if (this.selectedIdx == null && this.value.length > 0) {
      if (this.page < 1) {
        this.page = 1;
      } else {
        this.page = this.value.length;
      }
    }
  },
  computed: {
    selectedIdx () {
      if ( (this.page-1) >= 0 && (this.page-1) < this.value.length) {
        return this.page-1;
      } else {
        return null;
      }
    },
    filterItems () {
      items = [];
      const teams = this.value;
      for (let i = 0; i < teams.length; ++i) {
        items.push({
          text: `${teams[i].name1}, ${teams[i].name2}`,
          value: i,
        })
      }
      return items;
    },
  },
  template: `
  <v-tab-item>
    <v-layout row wrap>
      <v-file accept='.csv' @input='onImport'>
        Import
        <v-icon right>backup</v-icon>
      </v-file>
      <v-btn @click='onExport'>
        Export
        <v-icon right>archive</v-icon>
      </v-btn>
      <v-btn @click='randTeams'>
        Random
        <v-icon right>motorcycle</v-icon>
      </v-btn>
      <v-btn @click='addTeam'>
        New
        <v-icon right>add_circle</v-icon>
      </v-btn>
      <v-btn @click='deleteTeam' :disabled='selectedIdx == null'>
        Remove
        <v-icon right>delete</v-icon>
      </v-btn>
      <v-autocomplete :items='filterItems' :filter='fuzzyFilter' @input='onSearch'
        clearable append-icon='search' placeholder='Filter'>
      </v-autocomplete>
    </v-layout>

    <v-pagination v-model='page' :length='value.length' v-if='value.length > 0'>
    </v-pagination>

    <div v-if='selectedIdx != null'>
      <view-team v-model="value[selectedIdx]"></view-team>
    </div>
    <div v-else class="text-sm-center">
      no teams
    </div>

    <v-pagination v-model='page' :length='value.length' v-if='value.length > 0'>
    </v-pagination>
  </v-tab-item>
  `,
})

Vue.component('view-team', {
  data: () => ({
    map: null,
    marker: null,
    tiles: null,
    viewCoords: [49.48715, 8.46622],
    viewZoom: 13,
  }),
  props: [ 'value' ],
  mounted () {
    this.$nextTick(() => {
      this.map = new L.Map(this.$refs.map).setView(this.viewCoords, this.viewZoom);
      this.map.addEventListener('dblclick', this.onDoubleClick);
      this.map.doubleClickZoom.disable();
      this.tiles = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map); 
      this.updateMarker();
    })
  },
  beforeUpdate() {
    this.updateMarker();
  },
  methods: {
    updateMarker() {
      if (this.markerCoords) {
        if (this.marker == null) {
          this.marker = new L.Marker([0, 0], { draggable: true, } ); 
          const marker = this.marker;
          marker.draggable = true;
          marker.autoPan = true;
          marker.addEventListener('dragend', this.onMarkerDragged);
          marker.addTo(this.map);
        }
        this.marker.setLatLng(this.markerCoords); 
      } else {
        if (this.marker != null) {
          this.marker.remove();
          this.marker = null;
        }
      }
    },
    onMarkerDragged(event) {
      const latlng = event.target.getLatLng();
      this.$emit('input', {...this.value, coords: `${latlng.lat}, ${latlng.lng}`});
    },
    onDoubleClick(event) {
      const latlng = event.latlng;
      this.$emit('input', {...this.value, coords: `${latlng.lat}, ${latlng.lng}`});
    },
  },
  computed: {
    markerCoords() {
      return parseCoords(this.value.coords);
    }
  },
  props: ['value'],
  template: `
    <v-layout row wrap>
      <v-flex md6 xs12 pa-4>
        <v-text-field label='Name 1' v-model='value.name1'></v-text-field>
        <v-text-field label='Mail 1' v-model='value.mail1'></v-text-field>
        <v-text-field label='Phone 1' v-model='value.phone1'></v-text-field>
      </v-flex>
      <v-flex md6 xs12 pa-4>
        <v-text-field label='Name 2' v-model='value.name2'></v-text-field>
        <v-text-field label='Mail 2' v-model='value.mail2'></v-text-field>
        <v-text-field label='Phone 2' v-model='value.phone2'></v-text-field>
      </v-flex>
      <v-flex md6 xs12 pa-4>
        <v-text-field label='Address' v-model='value.address'></v-text-field>
        <v-text-field label='Comments' v-model='value.comments'></v-text-field>
        <v-text-field label='Coordinates' v-model='value.coords'></v-text-field>
        <v-layout row wrap>
          <v-checkbox xs2 label='Starter' v-model='value.starter'></v-checkbox>
          <v-checkbox xs2 label='Main' v-model='value.main'></v-checkbox>
          <v-checkbox xs2 label='Dessert' v-model='value.dessert'></v-checkbox>
        </v-layout>
      </v-flex>
      <v-flex md6 xs12 pa-4>
        <div ref='map' style='width: 100%; height: 400px;'>
        </div>
      </v-flex>
    </v-layout>
  `,
})
