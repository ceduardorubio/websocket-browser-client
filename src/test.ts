import { WebSocketBrowserClient } from ".";

interface User { }
interface NewUserResponse { }
let globalUsers: User[] = [];


let authCredentials = {
    email   : 'email',
    password: 'p45$.vv.0r6',
    //... your credentials
}

let wsClient = new WebSocketBrowserClient();

wsClient.connectTo('ws://localhost:8080',authCredentials);

wsClient.whenConnected = () => {
    console.log('WebSocketClient Connected');

    wsClient.echo({msg:'testing connection ...'},(error,response) => {
        console.log({error,response});
    });

    wsClient.request<User[]>('getUsers',{},(error,users) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            globalUsers = users;
        }
    });
};

wsClient.ifAuthenticationFails = (authenticationError) => {
    console.error({authenticationError});
}

wsClient.onConnectionLost = (connectionLostError,connectionLostInfo) => {
    console.error({connectionLostError,connectionLostInfo});    
}

wsClient.onMessageReceived<User>('newUser', globalUsers.push);

wsClient.joinGroup('group1');

wsClient.leaveGroup('group1');

wsClient.leaveAllGroups();

let btnNewUser = document.getElementById('btn-new-user');

let btnLogout = document.getElementById('btn-logout');

btnNewUser.addEventListener('click',() => {
    let newUser:User = { }
    wsClient.request<NewUserResponse,User>('createUser',newUser,(error,response:NewUserResponse) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            console.log('new user created');
        }
    });
});

btnLogout.addEventListener('click',() => {
    wsClient.close();
});