import { WebSocketClient } from ".";
import { SocketConnector,SocketConnectorOptions } from "./types";


let globalUsers: User[] = [];
export interface User {
    username:string;
    password:string;
}

export interface Credentials {
    email:string;
    password:string;
}

export interface NewUserResponse{
    done:boolean;
}

let authCredentials:Credentials = {
    email   : 'email',
    password: 'p45$.vv.0r6',
}

export interface SessionData {
    token:string;
    //...
}

let config:SocketConnectorOptions = {
    onConnectionErrorReconnect: true,
    authCallbackOnReconnect   : true,
    reconnectionTimeout       : 1000,
}

let websocketClient = WebSocketClient<SessionData>(config);

websocketClient.onConnectionErrorReconnect = true;
websocketClient.reconnectionTimeout        = 1000;
websocketClient.authCallbackOnReconnect    = true;

websocketClient.onError = (error,data) => {
    console.log('Error:',error);
    console.log('Data:',data);
};

websocketClient.connect<Credentials>('ws://localhost:8080',authCredentials,(error,sessionData) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        console.log('Websocket connected. All ');
        websocketClient.request<User[]>('getUsers',{},(error,users) => {
            if(error) {
                console.log('Error:',error);
                return;
            } else {
                globalUsers = users;
            }
        });

    }
});

websocketClient.echo('Hello World',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        console.log('Echo:',response);
    }
});

websocketClient.joinGroup('group1',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('Joined group1');
    }
});

websocketClient.leaveGroup('group1',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('leave group1');
    }
});

websocketClient.leaveAllGroups((error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('leave all groups');
    }
});

websocketClient.onBroadcast<User>('newUser',(error,user) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        globalUsers.push(user);
    }
});

websocketClient.logout((error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('Joined group1');
    }
});

let btnNewUser = document.getElementById('btn-new-user');

let btnLogout = document.getElementById('btn-logout');

btnNewUser.addEventListener('click',() => {
    let newUser:User = {
        username: 'username',
        password: 'password',
    }
    websocketClient.request<NewUserResponse,User>('createUser',newUser,(error,response:NewUserResponse) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            //response {done:true}
            console.log('new user created');
        }
    });
});

btnLogout.addEventListener('click',() => {
    websocketClient.logout((error,response) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            //response {done:true}
            console.log('Joined group1');
            websocketClient.close();
        }
    });
});