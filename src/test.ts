import { WebSocketClient } from ".";
import { SocketConnector } from "./types";

let websocketClient:SocketConnector<User>     = WebSocketClient<User>();
let globalUsers: User[] = [];
export interface User {
    username:string;
    password:string;
}

export interface Credentials {
    username:string;
    email:string;
}

let authCredentials:Credentials = {
    username:'username',
    email:'email',
}

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



websocketClient.onConnectionErrorReconnect = true;

websocketClient.reconnectionTimeout = 1000;

websocketClient.authCallbackOnReconnect = true;

websocketClient.onError = (error,data) => {
    console.log('Error:',error);
    console.log('Data:',data);
};

let btnNewUser = document.getElementById('btn-new-user');


btnNewUser.addEventListener('click',() => {
    websocketClient.request<User[]>('createUser',{},(error,users) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            globalUsers = users;
        }
    });
});

let btnLogout = document.getElementById('btn-logout');

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