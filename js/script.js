const { createApp } = Vue

createApp({
    data() {
        return {
            text: ''
        }
    },
    methods:{
        sendData(){
            fetch('save', { method: 'POST', body: JSON.stringify({text: this.text}) }).then( answer => {
                if (answer.ok){
                    return answer.json();
                }
            })
            .then( result => {
                console.log(result.link);
            })
        }
    }
}).mount('#app')