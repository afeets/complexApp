import axios from 'axios'


export default class RegistrationForm {
    constructor(){
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ''
        this.events()
    }

    // events
    events(){
        // alert('registration form js is running')
        this.username.addEventListener("keyup", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
    }


    // methods
    insertValidationElements(){
        this.allFields.forEach(function(element) {
            element.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }

    usernameHandler(){
        this.username.errors = false
        // alert("Username handler just ran")
        // skeleton to run code immediately 
        this.usernameImmediately()

        // code to run after delay
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => {this.usernameAfterDelay()}, 500)
    }


    usernameImmediately() {
        if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
          this.showValidationError(this.username, "Username can only contain letters and numbers.")
        }
    
        if (this.username.value.length > 30) {
          this.showValidationError(this.username, "Username cannot exceed 30 characters.")
        }
    
        if (!this.username.errors) {
          this.hideValidationError(this.username)
        }
    }


    showValidationError(element, message){
        element.nextElementSibling.innerHTML = message
        element.nextElementSibling.classList.add("liveValidateMessage--visible")
        element.errors = true
    }

    hideValidationError(element){
        element.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }


    usernameAfterDelay() {
        if (this.username.value.length < 3) {
          this.showValidationError(this.username, "Username must be at least 3 characters.")
        }

        // only check if no errors
        if (!this.username.errors){
            axios.post('/doesUsernameExist', { username: this.username.value }).then((response) => {
                if(response.data){
                    this.showValidationError(this.username, "That username is already taken")
                    this.username.isUnique = false
                } else {
                    this.username.isUnique = true
                }
            }).catch(() => {
                console.log('Please try again later')
            })
        }
      }

    isDifferent(element, handler){
        if(element.previousValue != element.value){
            handler.call(this)
        }
        element.previousValue = element.value
    }
}