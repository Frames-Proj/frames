import { safeClient } from "./util";

//load the current longNames into the list
async function loadNames(): Promise<void> {
    const dropdown : HTMLSelectElement = <HTMLSelectElement> this.refs.nameDropdown;

    const length : number = dropdown.length;

    for (let i = 0; i < length; i++) {
        dropdown.remove(0);
    }

    await safeClient.dns.getLongNames().then((data) => {
        data.forEach((name) => { dropdown.add(new Option(name, name)); });
    });
}

export async function addLongName(): Promise<void> {
    const inputField : HTMLInputElement = <HTMLInputElement> this.refs.longName;
    const name: string = inputField.value;
    if (name) {
        await safeClient.dns.register(name).then(() => {
            const errorMsg : HTMLElement = <HTMLElement> this.refs.error_msg;
            errorMsg.innerHTML = `LongName ${name} successfully registered!`;
        }, (err) => {
            const errorMsg : HTMLElement = <HTMLElement> this.refs.error_msg;
            errorMsg.innerHTML = "There was an error processing your request. Please choose a different LongName.";
        });
        await loadNames.bind(this)();
        inputField.value = '';
    }
};

export function prepareSignIn() {
    //connect this function to the button on the page
    //this.refs.nameDropdown.addEventListener('click', addLongName.bind(this), false);
    loadNames.bind(this)();
}
