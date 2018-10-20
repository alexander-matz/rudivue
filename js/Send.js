"use strict";

Vue.component('view-send', {
  data: () => ({
    token: '',
    sender: '',
    testmail: '',
    email: x => (/^.+@.+$/).test(x) || 'Invalid E-Mail',
  }),
  props: ['teams', 'templates', 'match', 'footer'],
  methods: {
    setError(err) {
      this.$emit('update:footer', err);
    }
  },
  methods: {
    downloadMails() {
      let buf = [];
      for (let i = 0; i < this.teams.length; ++i) {
        buf += "##################################################################";
        buf += "##################################################################";
        buf += `From: ${this.sender}`;
        buf += `To: ${this.team[i].mail1}, ${this.team[i].mail2}`;
        buf += "";
        buf += generateMail(i, this.teams, this.match, this.templates);
        buf += "";
      }
      downloadFile('mails-matched.txt', buf.join('\n'));
    },
    sendTestMail() {
    },
    sendAll() {
    },
  },
  computed: {
    errors() {
      if (this.teams.length <= 0)
        return 'No Teams';
      if (this.match == null)
        return 'No Matching';
      if (this.sender.indexOf('@') < 0)
        return 'No Sender Address';
      if (this.token == '')
        return 'No SmtpJs Token';
      return '';
    },
    canDownload() {
      if (this.teams.length <= 0)
        return false;
      if (!this.email(this.sender))
        return false;
      if (this.match == null)
        return false
      return true;
    },
    canTest() {
      if (this.token == '')
        return false;
      if (!this.email(this.sender))
        return false;
      if (!this.email(this.testmail))
        return false;
      return true;
    },
    canSend() {
      if (!this.canDownload)
        return false;
      if (this.sender.indexOf('@') < 0)
        return false;
      if (this.token == '')
        return false;
      return true;
    },
  },
  template: `
  <v-tab-item>
    <v-card-text>
      <v-layout row wrap>
        <v-flex md6 xs12 pa-1>
          <v-text-field label='SmtpJs Token' v-model='token'>
          </v-text-field>
        </v-flex>
        <v-flex md6 xs12 pa-1>
          <v-text-field label='Sender Address' v-model='sender' :rules='[email]'>
          </v-text-field>
        </v-flex>
        <v-flex xs6 pa-1>
          <v-text-field label='Test E-Mail' v-model='testmail' :rules='[email]'>
          </v-text-field>
        </v-flex>
        <v-flex xs6 pa-1>
          <v-btn :disabled='!canTest'>
            Send Test E-Mail
          </v-btn>
        </v-flex>
        <v-flex xs12 pa-1>
          <v-btn color='error' :disabled='!canSend'>
            Send All
          </v-btn>
          <v-btn :disabled='!canDownload' @click='downloadMails'>
            Download as Text
          </v-btn>
        </v-flex>
      </v-layout>
    </v-card-text>

    <v-footer color='warning' v-if='errors != ""'>
      <v-flex pa-3>
      {{ errors }}
      </v-flex>
    </v-footer>
  </v-tab-item>
  `
});
