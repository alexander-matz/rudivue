Vue.component('v-file', {
  methods: {
  },
  props: ['accept', 'text'],
  methods: {
    onPickFile (e) {
      this.$refs.elem.click()
    },
    onFilePicked (e) {
      const files = e.target.files || e.dataTransfer.files;
      if (files && files[0]) {
        let filename = files[0].name;
        const fileReader = new FileReader();
        fileReader.addEventListener('load', () => {
          this.$emit('input', fileReader.result);
        });
        fileReader.readAsText(files[0]);
      }
      e.target.value = null;
    },
  },
  template: `
    <div>
      <v-btn @click='onPickFile'> {{ text }} </v-btn>
      <input
        type='file'
        :accept='accept'
        ref='elem'
        @change='onFilePicked'
        style='position: absolute; left: -99999px'>
      </input>
    </div>
  `
});

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
  } catch (err) {
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text);
}
