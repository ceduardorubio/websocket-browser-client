import { SocketAction, WebSocketClient, SocketConnectorOptions, SocketFn, SocketListeners, SocketPackage, SocketPackageInfo, SocketPackageResponse, SocketServerCallsStack, WebSocketClientFn, WebSocketResponse } from "./types";

export const CreateWebSocketClient:WebSocketClientFn = <S = any>(connectionOptions:SocketConnectorOptions = null) => {
    
    let webSocket          :WebSocket              = null
    let packageID          :number                 = 0;
    let session            :S                      = null;
    let onServerResponse   :SocketServerCallsStack = {};
    let broadcastListeners :SocketListeners        = {};

    let authCredentials              :any  = null;
    let onAuthenticationResponse     :SocketFn |null           = null
    let url                          :string                   = null;
    let reconnect                    :boolean                  = true;
    let hasBeingConnectedBefore      :boolean                  = false;

    let onConnectionErrorReconnect   :boolean                         = true;
    let authCallbackOnReconnect      :boolean                         = true;
    let reconnectionTimeout          :number                          = 2_000;
    let onError                      :(error: any, data: any) => void = console.error;

    if(connectionOptions){
        onConnectionErrorReconnect = connectionOptions.onConnectionErrorReconnect || onConnectionErrorReconnect;
        authCallbackOnReconnect    = connectionOptions.authCallbackOnReconnect    || authCallbackOnReconnect;
        reconnectionTimeout        = connectionOptions.reconnectionTimeout        || reconnectionTimeout;
        onError                    = connectionOptions.onError                    || onError;
    }


    const ReloadConnection = (reconnectionWait:number = reconnectionTimeout) => {
        if(!reconnect ) {
            onError('auth failed',null);
        } else {
            setTimeout(() => {
                try {
                    ClearWebSocket();
                    StartSocket();                
                } catch(e){
                    onError('connection error',e);
                }
            },reconnectionWait);
        }
    }

    const ResetControllers = () => {
        packageID          = 0;
        session            = null;
        onServerResponse   = {};
        broadcastListeners = {};
    }

    const StartSocket = () => {
        ResetControllers();
        webSocket          = new WebSocket(url);
        webSocket.onerror   = onConnError;
        webSocket.onclose   = onConnError ;
        webSocket.onopen    = onConnOpen;
        webSocket.onmessage = onConnMessage;
    }

    const ClearWebSocket = () => {
        if(!webSocket) return; 
        webSocket.onclose   = () => {};
        webSocket.onerror   = () => {};
        webSocket.onopen    = () => {};
        webSocket.onmessage = () => {};
        webSocket.close();
        webSocket = null;
    }

    const onConnError = (e:any) => {
        onError('connection lost error',e);
        if (onConnectionErrorReconnect) ReloadConnection();
    }

    const onConnMessage = (xMsg:any) => {
        let packageResponse:SocketPackageResponse = null;
        try {
            packageResponse = JSON.parse(xMsg.data);
        } catch (e) {
            return onError( 'invalid incoming data: ', xMsg.data);
        }
        HandleServerMessage(packageResponse);
    }

    const onConnOpen = () => {
        Send<S>('auth','login',null,authCredentials,(error,sessionData) => {
            if(error){
                session   = null;
                reconnect = false;
                onAuthenticationResponse(error,null);
            } else {
                session = sessionData;
                if (hasBeingConnectedBefore) {
                    if (authCallbackOnReconnect) onAuthenticationResponse(null,sessionData);
                } else {
                    onAuthenticationResponse(null,sessionData);
                    hasBeingConnectedBefore = true;
                }
            }
        });
    }

    const HandleServerMessage = (r:SocketPackageResponse) => {
        let { info,error,response } = r;
        if(info.action == "broadcast"){
            let { request } = info;
            if(broadcastListeners[request]) {
                let listeners = broadcastListeners[request];
                listeners.forEach(fn => fn(error,response));
            }
        } else {
            let isServerResponse = info.action == "call" || info.action == "group" || info.action == "auth"
            if(isServerResponse){
                let { packageID } = info;
                if(onServerResponse[packageID]){
                    let onResponseToPackage = onServerResponse[packageID];
                    onResponseToPackage(error,response);
                    delete onServerResponse[packageID];
                }
            }
        }
    }

    const Send = <T = WebSocketResponse> (action:SocketAction,request:string | number,group:string = '',data:any = null,cbOnResponse:(error: any, response: T) => void  = null) => {
        if(session){
            let info: SocketPackageInfo = { action,request,group,packageID } ;
            let body:SocketPackage      = { info, data}
            if(cbOnResponse) {
                onServerResponse[packageID] = cbOnResponse;
                packageID++;
            }
            webSocket.send(JSON.stringify(body));
        } else {
            cbOnResponse('not authenticated',null);
        }
    }

    const echo = <T = any>(data:T,cb:(error: any, response: {echoAt:number,received:T}) => void = null) => {
        Send<{echoAt:number,received:T}>('call','echo',null,data,cb);
    }

    const request = <T = any,R= any>(request:string | number,data:R,cb:(error: any, response: T) => void = null) => {
        Send('call',request,null,data,cb);
    }

    const joinGroup = (group:string,cb:(error: any, response: WebSocketResponse) => void) => {
        Send('group','join',group,null,cb);
    }

    const leaveGroup = (group:string,cb:(error: any, response: WebSocketResponse) => void) => {
        Send('group','leave',group,null,cb);
    }

    const leaveAllGroups = (cb:(error: any, response: WebSocketResponse) => void) => {
        Send('group','leaveAll',null,null,cb);
    }

    const onBroadcast = <T = any>(name:string,cb:(error: any, response: T) => void) => {
        if(!broadcastListeners[name]) broadcastListeners[name] = [];
        broadcastListeners[name].push(cb);
    }

    const logout = (cb:SocketFn) => {
        reconnect = false;
        Send('auth','logout',null,null,(error,response) => {
            close();
            cb(error,response);
        });
    }

    const close = () => {
        reconnect = false;
        ClearWebSocket();
        ResetControllers();
    }

    const connect = <T = any>(websocketServerURL:string,newAuthCredentials:T,authResponseCallback:(error: any, response: S) => void) => {
        let u = websocketServerURL;
        if(u.startsWith('http://'))  u = u.replace('http://','ws://')
        if(u.startsWith('https://')) u = u.replace('https://','wss://')
        if(!u.startsWith('ws://') && !u.startsWith('wss://')) u = 'ws://' + u;
        url                      = u;
        reconnect                = true;
        authCredentials          = newAuthCredentials;
        hasBeingConnectedBefore  = false;
        onAuthenticationResponse = authResponseCallback;
        ReloadConnection(1);
    }

    let result: WebSocketClient<S> = {
        request,
        joinGroup,
        leaveGroup,
        leaveAllGroups,

        onBroadcast,
        logout,
        connect,
        close,
        echo,
        get onConnectionErrorReconnect() : boolean {
            return onConnectionErrorReconnect
        },
        set onConnectionErrorReconnect(v : boolean) {
            onConnectionErrorReconnect = v;
        },
        get reconnectionTimeout() : number {
            return reconnectionTimeout
        },
        set reconnectionTimeout(v : number) {
            reconnectionTimeout = v;
        },
        get authCallbackOnReconnect() : boolean {
            return authCallbackOnReconnect
        },
        set authCallbackOnReconnect(v : boolean) {
            authCallbackOnReconnect = v;
        },
        get onError() : (error: any, data: any) => void {
            return onError
        },
        set onError(v : (error: any, data: any) => void) {
            onError = v;
        },
        get sessionData() : S {
            return session
        },
        set sessionData(v : S) {
            //session = v;
        }
    }

    return result
}