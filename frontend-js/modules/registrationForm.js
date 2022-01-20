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
        alert("Username handler just ran")
    }

    isDifferent(element, handler){
        if(element.previousValue != element.value){
            handler.call(this)
        }
        element.previousValue = element.value
    }
}