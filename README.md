# Web Socket Browser Client

## Description
A web socket client for web socket process connector servers. Use this client to connect to a web socket server and send and receive messages.

## Installation
```bash
npm install --save websocket-browser-client
```
# Setup
## 1. Create the Client

```typescript
// Example
import { CreateWebSocketClient } from "WebSocketBrowserClient";
import { WebSocketClient,SocketConnectorOptions } from "./types";

export interface SessionData {
      //... your session data
      //token:string; for example
} 

let config:SocketConnectorOptions = {
    onConnectionErrorReconnect: true,   // optional default true
    authCallbackOnReconnect   : true,   // optional default true
    reconnectionTimeout       : 2000,   // optional default 2000
}

let websocketClient:WebSocketClient<SessionData> = CreateWebSocketClient<SessionData>(config);

websocketClient.onConnectionErrorReconnect = true; // same as config.onConnectionErrorReconnect
websocketClient.authCallbackOnReconnect    = true; // same as config.authCallbackOnReconnect
websocketClient.reconnectionTimeout        = 1000; // same as config.reconnectionTimeout

websocketClient.onError = (error,data) => {
    console.log('Error:',error);
    console.log('Error Data:',data);
};

```

Description 

## 2. Connect
    
 ```typescript
 // Example 
let authCredentials:Credentials = {
    //... your credentials
}

export interface SessionData {
      //... your session data
      //token:string; for example
} 

websocketClient.connect<Credentials>('ws://localhost:8080',authCredentials,(error,sessionData:SessionData) => {
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

### Options

## 3. Test the Client Connection (optional)


```typescript
// Example
export interface MyDataType {
    //... your data
}

let data:MyDataType = {
    //... your data
}

websocketClient.echo<MyDataType>(data,(error,response: {echoAt:number,received:MyDataType}) => {
    if(error) {
        console.log('Error:',error);
        return;
    } else {
        console.log('Echo:',response);
    }
});
```
Description

# Usage - API
### Request

```typescript
// Example
export interface User {
    //... your user data 
}
        
export interface NewUserResponse{
    // ... your response data
}

let newUser: User = {
    //... 
}

let globalUsers:User[] = [];

websocketClient.request<NewUserResponse,User>('createUser',newUser,(error,user:NewUserResponse) => {
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
//Example
export interface User {
    //... your user data 
}

let globalUsers:User[] = [];

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

## Groups

```typescript
// inner interface use as response interface for joinGroup, leaveGroup, leaveAllGroups
export interface WebSocketResponse {
    done:boolean;
}
```

### Join Group
    
```typescript
websocketClient.joinGroup('group1',(error,response:WebSocketResponse) => {
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

websocketClient.leaveGroup('group1',(error,response:WebSocketResponse) => {
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
websocketClient.leaveAllGroups((error,response:WebSocketResponse) => {
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

## TYPES / INTERFACES

```typescript
export interface SocketConnector<S> {
    request                   : <T = any,R = any>(request:string | number,body:R,cb:(error: any, response: T) => void) => void;
    connect                   : <T = any>(websocketServerURL:string,authCredentials:T,newOnAuthSuccess:(error: any, response: S) => void) => void;
    onBroadcast               : <T = any>(name:string,cb:(error: any, response: T) => void) => void;
    joinGroup                 : (group:string,cb:(error: any, response: WebSocketResponse) => void) => void;
    leaveGroup                : (group:string,cb:(error: any, response: WebSocketResponse) => void) => void;
    leaveAllGroups            : (cb:(error: any, response: WebSocketResponse) => void) => void;
    logout                    : (cb:SocketFn) => void;
    close                     : () => void;
    onConnectionErrorReconnect: boolean;
    reconnectionTimeout       : number;
    authCallbackOnReconnect   : boolean;
    onError                   : (error: any, data: any) => void,
    sessionData               : any,
    echo                      : <T = any>(data:T,cb:(error: any, response: {echoAt:number,received:T}) => void) => void;
}

export interface SocketConnectorOptions {
    onConnectionErrorReconnect?: boolean,
    authCallbackOnReconnect?   : boolean,
    reconnectionTimeout?       : number,
    onError?                   : (data:any) => void
}
```


## READ THE CODE ON

[github: websocket-browser-client](https://github.com/ceduardorubio/websocket-browser-client)

## License

[MIT](LICENSE)

## Author

Carlos Velasquez - [ceduardorubio](https://github.com/ceduardorubio)

## Keywords

[websocket](https://www.npmjs.com/search?q=keywords:web%20socket), [websocket client](https://www.npmjs.com/search?q=keywords:websocket%20client), [websocket browser client](https://www.npmjs.com/search?q=keywords:websocket%20browser%20client), [websocket client browser](https://www.npmjs.com/search?q=keywords:websocket%20client%20browser), [websocket client browser](https://www.npmjs.com/search?q=keywords:websocket%20client%20browser), [socket client browser](https://www.npmjs.com/search?q=keywords:socket%20client%20browser)