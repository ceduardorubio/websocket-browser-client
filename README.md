# Web Socket Browser Client

## Description
A web socket client for web socket process connector servers. Use this client to connect to a web socket server and send and receive messages.

## Installation
```bash
npm install --save websocket-browser-client
```
## Usage
### Setup

```typescript

import { WebSocketClient } from "WebSocketBrowserClient";
import { SocketConnector,SocketConnectorOptions } from "./types";

let config:SocketConnectorOptions = {
    onConnectionErrorReconnect: true, 
    authCallbackOnReconnect   : true,
    reconnectionTimeout       : 1000,
}

let websocketClient:SocketConnector<User>     = WebSocketClient<User>(config);

websocketClient.onConnectionErrorReconnect = true;
websocketClient.authCallbackOnReconnect    = true;
websocketClient.reconnectionTimeout        = 1000;

websocketClient.onError = (error,data) => {
    console.log('Error:',error);
    console.log('Data:',data);
};

```

Description 

### Connect
    
 ```typescript

websocketClient.connect<Credentials>('ws://localhost:8080',authCredentials,(error,sessionData) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        console.log('Websocket connected. All ');
        // Connection is established
        // ... 
        // your post connection logic here
    }
});
```
Description 

**Options**

### Echo

```typescript
websocketClient.echo('Hello World',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        console.log('Echo:',response);
    }
});
```
Description

### Request

```typescript
    websocketClient.request<User[]>('createUser',{},(error,users) => {
        if(error) {
            console.log('Error:',error);
            return;
        } else {
            globalUsers = users;
        }
    });
```
Description

### OnBroadcast

```typescript

websocketClient.onBroadcast<User>('newUser',(error,user:User) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        globalUsers.push(user);
    }
});
```
Description

### Join Group
    
```typescript
websocketClient.joinGroup('group1',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('Joined group1');
    }
});
```
Description

### Leave Group

```typescript

websocketClient.leaveGroup('group1',(error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('leave group1');
    }
});
```
Description

### Leave All Groups

```typescript
websocketClient.leaveAllGroups((error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('leave all groups');
    }
});
```
Description

### Logout
    
```typescript
websocketClient.logout((error,response) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        //response {done:true}
        console.log('Joined group1');
    }
});
```
Description

### Close
   
```typescript
 websocketClient.close();
```
Description

## License

## Author Information
