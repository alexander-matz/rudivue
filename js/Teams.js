Vue.component('view-teams', {
  data: () => ({
    page: 1,
    snackbarColor: 'success',
    snackbarItems: [],
    snackbar: false,
  }),
  props: [ 'value' ],
  methods: {
    randTeams () {
      for (let i = 0; i < 9; ++i) {
        this.value.push(randomTeam());
      }
    },
    newTeam () {
      this.$emit('input', [...this.value, emptyTeam()]);
      this.$nextTick(() => {
        this.page = this.value.length;
      });
    },
    removeTeam () {
    },
    snack(msgs, color) {
      this.snackbarColor = color;
      this.snackbarItems = msgs;
      this.snackbar = true;
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
        this.snack(errors, 'error');
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
          this.snack(missing.map(x => `missing field ${x}`), 'warning');
        }
        let teams = [];
        for (let i = 0; i < data.length; ++i) {
          teams.push(cleanTeam(data[i]));
        }
        this.$emit('input', teams);
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
  },
  template: `
  <v-tab-item>
    <v-snackbar v-model='snackbar' :color='snackbarColor' auto-height>
      <ul style='list-style: none'>
        <li v-for='item in snackbarItems'>
          {{ item }}
        </li>
      </ul>
    </v-snackbar>
    <v-layout row wrap>
      <v-flex md3 xs4>
        <v-btn @click='randTeams'>
          Random Teams
        </v-btn>
      </v-flex>
      <v-flex md3 xs4>
        <v-btn @click='newTeam'>
          New Team
        </v-btn>
      </v-flex>
      <v-flex md3 xs4>
        <v-file accept='.csv' @input='onImport' text='Import Teams'>
        </v-file>
      </v-flex>
      <v-flex md6 xs12 block>
      </v-flex>
    </v-layout>

    <v-pagination v-model='page' :length='value.length'>
    </v-pagination>

    <div v-if='selectedIdx != null'>
      <view-team v-model="value[selectedIdx]"></view-team>
    </div>
    <div v-else class="text-sm-center">
      no teams
    </div>

    <v-pagination v-model='page' :length='value.length'>
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
