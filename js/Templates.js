Vue.component('view-templates', {
  data: () => ({
    choice: 'starter',
    variable: 'name1',
    variables: [
      'name1', 'mail1', 'phone1'
    ],
    cursor: 0,
  }),
  props: [ 'value' ],
  computed: {
    items() {
      return Object.keys(this.value);
    }
  },
  methods: {
    onImport(text) {
      let newTemplates = {...this.value};
      newTemplates[this.choice] = text;
      this.$emit('input', {target: {value: newTemplates}});
    },
    onAddVariable(event) {
      copyTextToClipboard(event);
    },
  },
  template: `
    <v-tab-item>
      <v-layout row wrap>
        <v-flex md4 xs12>
          <v-select v-model='choice' :items='items' label='Select Mail Type'>
          </v-select>
        </v-flex>
        <v-flex md4 xs12>
          <v-file accept='*.txt' :text='"import " + this.choice + " template"' @input='onImport'>
          </v-file>
        </v-flex>
        <v-flex md4 xs12>
          <v-select v-model='variable' :items='variables' @input='onAddVariable'>
            <template slot='selection' slot-scope='{ index }'>
              <span v-if='index === 0'>
                Copy a variable to clipboard
              </span>
            </template>
          </v-select>
        </v-flex>
      </v-layout>
      </v-select>
      <v-textarea
        label="Mail Template"
        auto-grow
        v-model='value[choice]'>
      </v-textarea>
    </v-tab-item>
  `,
});
