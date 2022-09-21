const { createApp } = Vue

createApp({
    data() {
        return {
            text: '',
            result: null
        }
    },
    methods:{
        sendData(){
            fetch('save', { method: 'POST', body: JSON.stringify({text: this.text}) }).then( answer => {
                if (answer.ok){
                    return answer.json();
                }
            })
            .then( res => {
                this.result = res
            })
        }
    }
}).mount('#app')