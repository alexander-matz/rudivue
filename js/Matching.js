
Vue.component('view-matching', {
  data: () => ({
    busy: false,
    sync: false,
    match: null,
    bestScore: Infinity,
  }),
  props: [ 'value', 'teams' ],
  methods: {
    startMatching() {
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
      this.bestScore = Matching.score(this.match);
      this.sync = true;
      this.busy = true;
    },
    continueMatching() {
      const teams = this.teams;

      for (let j = 0; j < 1000; ++j) {
        let attempt = Matching.copy(this.match);

        for (let i = 0; i < 10; ++i) {
          const hit = Math.random() < 0.2;
          if (!hit) continue;
          const dish = Math.floor(Math.random() * 3);
          const seat = Math.floor(Math.random() * 3);
          const g1 = Math.floor(Math.random() * (teams.length / 3));
          const g2 = Math.floor(Math.random() * (teams.length / 3));
          Matching.swapSeats(attempt, dish, seat, g1, g2);
        }

        for (let i = 0; i < 2; ++i) {
          const hit = Math.random() < 0.125;
          if (!hit) continue;
          const t1 = Math.floor(Math.random() * teams.length);
          const t2 = Math.floor(Math.random() * teams.length);
          Matching.swapTeams(attempt, t1, t2);
        }
        const score = Matching.score(attempt);
        if (score < this.bestScore) {
          this.match = attempt;
          this.bestScore = score;
        }
      }
      console.log('done');
    },
    stopMatching() {
      this.busy = false;
    },
  },
  computed: {
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
  <v-tab-item>

    <v-layout row wrap v-if='problems == null'>
      <v-flex md4 xs12 pa-4>
        <v-layout row>
          <v-btn v-if='!busy' @click='startMatching'>
            Start Matching
          </v-btn>
          <v-btn v-else @click='stopMatching'>
            Stop Matching
          </v-btn>
        </v-layout>
        <v-layout row>
          <v-btn @click='continueMatching'>
            Continue Matching
          </v-btn>
        </v-layout>
        <v-layout row>
          Current best score: {{ bestScore }}
        </v-layout>
      </v-flex>
      <v-flex md8 xs12 pa-4 v-if='match != null'>
        <view-match v-model='match' v-bind:teams='teams'>
        </view-match>
      </v-flex>
      <v-flex md8 xs12 pa-4 v-else>
        no matching yet
      </v-flex>
    </v-layout>

    <v-layout row wrap v-else>
      {{ problems }}
    </v-layout>

  </v-tab-item>
  `,
});

Vue.component('view-match', {
  data: () => ({
    page: 1,
  }),
  props: [ 'value', 'teams' ],
  computed: {
    team() {
      return this.page-1;
    },
    cooks() {
      const cooks = Matching.getTour(this.value, this.page-1).cooks;
      switch (cooks) {
        case 0: return 'starter';
        case 1: return 'main';
        case 2: return 'dessert';
        default: return 'N/A';
      }
    },
    tour() {
      return Matching.getTour(this.value, this.page-1).tour;
    },
    classDish(num) {
      if (this.tour[num][0] == this.team) {
        return 'font-weight-medium'
      } else {
        return ''
      }
    },
    hostDish(num) {
      if (this.tour[num][0] == this.team) {
        return ''
      } else {
        return '(Host: ' + this.teamStr(this.tour[num][0]) + ')'
      }
    }
  },
  methods: {
    teamStr(teamIdx) {
      console.log(teamIdx)
      const team = this.teams[teamIdx];
      return `${team.name1}, ${team.name2}`
    }
  },
  template: `
    <div>
      <v-pagination v-model='page' :length='teams.length'></v-pagination>
      <v-card>
        <v-card-title class='title'>
          {{ teamStr(team) }}
        </v-card-title>
        <v-card-text>
          <div class='subheading' pb-4>
            Cooks: {{ cooks }}
          </div>

          <div class='subheading {{ classDish(0) }}' pb-4>
            Starter {{ hostDish(0) }}
          </div>
          <div>
            Guest 1: {{ teamStr(tour[0][1]) }}
          </div>
          <div>
            Guest 2: {{ teamStr(tour[0][2]) }}
          </div>

          <div class='subheading' pb-4>
            Main (Host: {{ teamStr(tour[1][0]) }})
          </div>
          <div>
            Guest 1: {{ teamStr(tour[1][1]) }}
          </div>
          <div>
            Guest 2: {{ teamStr(tour[1][2]) }}
          </div>

          <div class='subheading' pb-4>
            Dessert (Host: {{ teamStr(tour[2][0]) }})
          </div>
          <div>
            Guest 1: {{ teamStr(tour[2][1]) }}
          </div>
          <div>
            Guest 2: {{ teamStr(tour[2][2]) }}
          </div>
        </v-card-text>
      </v-card>
    </div>
  `
});
