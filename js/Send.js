"use strict";

Vue.component('view-send', {
  data: () => ({
    busy: false,
    email: x => (/^.+@.+$/).test(x) || 'Invalid E-Mail',
  }),
  props: ['teams', 'templates', 'match', 'snack', 'token', 'subject', 'sender', 'testmail'],
  methods: {
  },
  methods: {
    downloadMails() {
      let buf = [];
      for (let i = 0; i < this.teams.length; ++i) {
        buf.push("##################################################################");
        buf.push("##################################################################");
        buf.push(`From: ${this.sender}`);
        buf.push(`To: ${this.teams[i].mail1}, ${this.teams[i].mail2}`);
        buf.push("");
        buf.push(generateMail(i, this.teams, this.match, this.templates));
        buf.push("");
      }
      downloadFile('mails-matched.txt', buf.join('\n'));
    },
    callbackTest(message) {
      if (message.toLowerCase() != 'ok') {
        this.logError(`'${message}'`);
      } else {
        this.logSuccess('Successfully sent E-Mail');
      }
      this.busy = false;
    },
    sendTestMail() {
      Email.send(
        this.sender,
        this.testmail,
        'Test E-Mail',
        'It Works!',
        { token: this.token,
          callback: this.callbackTest,
        }
      );
      this.busy = true;
    },

    callbackAll(message) {
    },
    sendAll() {
    },

    logSuccess(message) {
      this.$emit('update:snack', {
        visible: true,
        color: 'success',
        items: [message],
      });
    },
    logError(items) {
      this.$emit('update:snack', {
        visible: true,
        color: 'error',
        items: items,
      });
      for (let i = 0; i < items.length; ++i) {
        console.log(items[i]);
      }
    }
  },
  computed: {
    errors() {
      if (this.teams.length <= 0)
        return 'No Teams';
      if (this.match == null)
        return 'No Matching';
      if (this.email(this.sender) != true)
        return 'No Sender Address';
      if (this.token == '')
        return 'No SmtpJs Token';
      return '';
    },
    canDownload() {
      if (this.teams.length <= 0)
        return false;
      if (this.email(this.sender) != true)
        return false;
      if (this.match == null)
        return false
      return true;
    },
    canTest() {
      if (this.token == '') {
        return false;
      }
      if (this.email(this.sender) != true) {
        return false;
      }
      if (this.email(this.testmail) != true) {
        return false;
      }
      return true;
    },
    canSend() {
      if (!this.canDownload)
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
          <v-text-field label='SmtpJs Token' v-bind:value='token' @input='$emit("update:token", $event)'>
          </v-text-field>
        </v-flex>
        <v-flex md3 xs9 pa-1>
          <v-text-field label='Test E-Mail' :rules='[email]'
            v-bind:value='testmail' @input='$emit("update:testmail", $event)'>
          </v-text-field>
        </v-flex>
        <v-flex md3 xs3 pa-1>
          <v-btn :disabled='!canTest' @click='sendTestMail'>
            Send Test E-Mail
          </v-btn>
        </v-flex>
        <v-flex md6 xs12 pa-1>
          <v-text-field label='Subject' v-bind:value='subject' @input='$emit("update:subject", $event)'>
          </v-text-field>
        </v-flex>
        <v-flex md6 xs12 pa-1>
          <v-text-field label='Sender Address' :rules='[email]'
            v-bind:value='sender' @input='$emit("update:sender", $event)'>
          </v-text-field>
        </v-flex>
        <v-flex xs12 pa-1>
          <v-btn color='error' :disabled='!canSend'>
            Send All
          </v-btn>
          <v-btn :disabled='!canDownload' @click='downloadMails'>
            Download as Text
          </v-btn>
          <v-progress-circular indeterminate v-if='busy'>
          </v-progress-circular>
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
