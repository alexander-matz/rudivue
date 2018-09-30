Vue.component('view-matching', {
  data: () => ({
    numRounds: 50,
    busy: false,
    score: Infinity,
    workers: null,
    match: null,
  }),
  destroyed() {
    this.stopMatching();
  },
  props: [ 'value', 'teams' ],
  methods: {
    resetMatching() {

      this.stopMatching();

      let constraints = [];
      constraints.push({type: 'meet-once'});
      constraints.push({type: 'ways-short'});
      constraints.push({type: 'ways-equal'});
      const teams = this.teams;
      for (let i = 0; i < teams.length; ++i) {
        if (!teams[i].starter) constraints.push({
          type: 'not-dish', team: i, dish: 0
        });
        if (!teams[i].main) constraints.push({
          type: 'not-dish', team: i, dish: 1
        });
        if (!teams[i].dessert) constraints.push({
          type: 'not-dish', team: i, dish: 2
        });
      }
      const coords = teams.map(x => parseCoords(x.coords));
      this.match = Matching.init(teams.length, 3, coords, constraints);
      this.score = Matching.score(this.match);
      this.$emit('input', this.match);
    },
    startMatching() {
      this.workers = [];
      for (let i = 0; i < 4; ++i) {
        let worker = new Worker('js/worker.js');
        worker.onmessage = this.handleMessage;
        worker.postMessage({
          score: this.score,
          match: this.match,
          rounds: this.numRounds
        });
        this.workers.push(worker);
      }
      this.busy = true;
    },
    stopMatching() {
      this.workers.forEach(worker => worker.terminate());
      this.workers = null;
      this.busy = false;
    },
    handleMessage(event) {
      const {score, match} = event.data;
      if (score < this.score) {
        this.score = score;
        this.match = match;
        this.$emit('input', match);
      }
      if (this.busy) {
        event.target.postMessage({
          score: this.score,
          match: this.match,
          rounds: this.numRounds
        });
      }
    },
    stopMatching() {
      this.busy = false;
    },
    onSearch(index) {
      this.page = index + 1;
    }
  },
  computed: {
    filterItems() {
      items = [];
      const teams = this.teams;
      for (let i = 0; i < teams.length; ++i) {
        items.push({
          text: `${teams[i].name1}, ${teams[i].name2}`,
          value: i,
        })
      }
      return items;
    },
    problems() {
      const teams = this.teams;
      if (teams.length < 9) {
        return 'Not enough teams (9 minimum)';
      }
      if (teams.length % 3 != 0) {
        return 'Number of teams not divisable by 3';
      }
      for (let i = 0; i < teams.length; ++i) {
        if (parseCoords(teams[i].coords) == null) {
          return 'Not all teams have coordinates';
        }
      }
      return null;
    }
  },
  template: `
  <v-tab-item v-if='problems == null'>
    <v-layout wrap>
      <v-flex md6 xs12>
        <v-btn v-if='match == null' @click='resetMatching'>
          Initialize
        </v-btn>
        <v-btn v-else @click='resetMatching'>
          Reset
        </v-btn>
        <v-btn :disabled='match == null' v-if='!busy' @click='startMatching'>
          Improve!
        </v-btn>
        <v-btn :disabled='match == null' v-else @click='stopMatching'>
          Stop!
        </v-btn>
        <v-btn v-if='this.match != null' color='info'>
          {{ this.score.toFixed(2) }}
        </v-btn>
      </v-flex>
      <v-flex md6 xs12>
        <v-autocomplete :items='filterItems' :filter='fuzzyFilter' @input='onSearch'
          clearable append-icon='search' placeholder='Filter'>
        </v-autocomplete>
      </v-flex>
      <v-flex xs12 v-if='match != null'>
        <view-match v-model='match' v-bind:teams='teams'>
        </view-match>
      </v-flex>
      <v-flex xs12 v-else>
        <p class='text-xs-center'>
          Mo matching yet
        </p>
      </v-flex>
    </v-layout>
  </v-tab-item>

  <v-tab-item v-else>
    <v-layout>
      <v-flex xs12 class='text-xs-center'>
        {{ problems }}
      </v-flex>
    </v-layout>
  </v-tab-item>
  `,
});

Vue.component('view-match', {
  data: () => ({
    page: 1,
    dishes: ['Starter', 'Main', 'Dessert'],
  }),
  props: [ 'value', 'teams' ],
  computed: {
    team() {
      return this.page-1;
    },
    cooks() {
      return Matching.getTour(this.value, this.page-1).cooks;
    },
    tour() {
      return Matching.getTour(this.value, this.page-1).tour;
    },
  },
  methods: {
    classDish(num) {
      const pre = 'mt-3 subheading';
      if (this.tour[num][0] == this.team) {
        return pre + ' font-weight-medium'
      } else {
        return pre;
      }
    },
    teamAddr(teamIdx) {
      const team = this.teams[teamIdx];
      return `${team.address}`;
    },
    teamStr(teamIdx) {
      const team = this.teams[teamIdx];
      return `${team.name1}, ${team.name2}`;
    },
  },
  template: `
    <v-card>
      <v-layout wrap>
        <v-flex xs12>
          <v-pagination v-model='page' :length='teams.length'></v-pagination>
        </v-flex>
      </v-layout>
      <v-card-title class='title'>
        {{ teamStr(team) }}
      </v-card-title>
      <v-card-text>
        <div class='subheading'>
          Cooks: {{ dishes[cooks] }}
        </div>
        <div v-for='dish in [0, 1, 2]'>
          <div :class='classDish(dish)'>{{ dishes[dish] }} @ {{ teamAddr(tour[dish][0]) }}</div>
          <v-list>
            <v-list-tile>
              <v-list-tile-content>
                <v-list-tile-title class='font-weight-medium'>
                  {{ teamStr(tour[dish][0]) }} (Host)
                </v-list-tile-title>
                <v-list-tile-sub-title class='pl-2'>
                  {{ teams[tour[dish][0]].comments }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile>
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ teamStr(tour[dish][1]) }} (Guest)
                </v-list-tile-title>
                <v-list-tile-sub-title class='pl-2'>
                  {{ teams[tour[dish][1]].comments }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile>
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ teamStr(tour[dish][2]) }} (Guest)
                </v-list-tile-title>
                <v-list-tile-sub-title class='pl-2'>
                  {{ teams[tour[dish][2]].comments }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  `
});
