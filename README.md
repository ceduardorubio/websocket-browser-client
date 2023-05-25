# Web Socket Browser Client

## Description
A web socket browser client for web socket process connector servers. Use this client to connect to a web socket server and send and receive messages.

USE THIS CLIENT TO CONNECT TO A WEB SOCKET SERVER SET WITH 
[websocket node server](https://www.npmjs.com/package/ws-node-server)
[web socket process connector](https://www.npmjs.com/package/web-socket-processes-connector)

## Installation
```bash
npm install --save ws-browser-client
```
## Connection Setup
```typescript
import { WebSocketBrowserClient } from "ws-browser-client";

let options = null;
/*  default values
    options = {
        onConnectionErrorReconnect: true,
        authCallbackOnReconnect:true,
        reconnectionTimeout: 2_000
    }
*/

let Logger = null;
/*  default values
    Logger = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    }

    use this to log all incoming messages
*/
export const wsClient = new WebSocketBrowserClient(options,Logger);

let authCredentials = {
    //... your credentials
}
// set what to do if authentication is successful
wsClient.whenConnected = () => {
    console.log('WebSocketClient Connected');
    // ... now you can use the client in other parts of your application
    AfterConnectedProcedure();
};
// set what to do if authentication fails
wsClient.ifAuthenticationFails = (authenticationError) => {
    console.error({authenticationError});
}
// set what to do if connection is lost
wsClient.onConnectionError = (connectionLostError,connectionLostInfo) => {
    console.error({connectionLostError,connectionLostInfo});    
}

wsClient.onConnectionClosed = (connectionCloseError,connectionCloseEvent) => {
    console.log({connectionCloseError,connectionCloseEvent});
}
// execute the connection to the server
wsClient.connectTo('ws://localhost:8080',authCredentials);
```
You can rewrite the `whenConnected`, `ifAuthenticationFails` and `onConnectionError` methods anytime before the `connectTo` method is called.
## API: After Connection Setup
```typescript
interface User { }
interface NewUserResponse { }
let globalUsers: User[] = [];

const AfterConnectedProcedure = () => {
    // after connection is done, you can read de session data return by the server
    let sessionData = wsClient.session
    // send a echo message to the server and wait for a response
    wsClient.echo({msg:'testing connection ...'},(error,response) => {
        console.log({error,response});
    });
    // send a request message to the server and wait for a response to get an array of users
    wsClient.request<User[]>('getUsers',{},(error,users) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            globalUsers = users;
        }
    });
    // join the group1 to receive messages from the server for this group
    wsClient.joinGroup('group1');
    // leave the group1
    wsClient.leaveGroup('group1');
    // leave all groups
    wsClient.leaveAllGroups();
}

// you can set a onMessageReceived listener, 
// to receive messages from the server 
// before or after the connection setup is done
wsClient.onMessageReceived<User>('newUser', globalUsers.push);
```

## API: Example
As long as the connection is open, you can send messages to the server and receive messages from the server in any part of your application.
```typescript
let btnNewUser = document.getElementById('btn-new-user');
let btnLogout  = document.getElementById('btn-logout');

btnNewUser.addEventListener('click',() => {
    let newUser:User = { }
    // send a request message to the server and wait for a response to create a new user
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
    // close the connection
    wsClient.close();
});

```


## READ THE CODE ON

[github: websocket-browser-client](https://github.com/ceduardorubio/websocket-browser-client)

## License

[MIT](LICENSE)

## Author

Carlos Velasquez - [ceduardorubio](https://github.com/ceduardorubio)

## Keywords

[websocket](https://www.npmjs.com/search?q=keywords:web%20socket), [websocket client](https://www.npmjs.com/search?q=keywords:websocket%20client), [websocket browser client](https://www.npmjs.com/search?q=keywords:websocket%20browser%20client), [websocket client browser](https://www.npmjs.com/search?q=keywords:websocket%20client%20browser), [websocket client browser](https://www.npmjs.com/search?q=keywords:websocket%20client%20browser), [socket client browser](https://www.npmjs.com/search?q=keywords:socket%20client%20browser)

## Change Log

### 0.0.3
    - session is now available after connection is done. [wwsClient.sessión
### 0.0.5
    - with src folder 