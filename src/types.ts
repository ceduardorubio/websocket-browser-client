
export interface SocketSession {
    isAlive: boolean,
    data   : SocketPackageData,
    groups : string[],
}

export interface SocketPackage {
    info: SocketPackageInfo,
    data: SocketPackageData
}

export interface SocketPackageInfo {
    action   : SocketAction
    request  : string | number,
    group    : string,
    packageID: number
}

export interface SocketPackageData {
    [key: string | number]: any
}

export interface SocketPackageResponse {
    info    : SocketPackageInfo,
    error   : any,
    response: any
}

export interface SocketServerCallsStack {
    [key: number]: SocketFn
}

export interface SocketListeners {
    [key: string]: SocketFn[]
}

export type SocketFn     = (error: any, response: any) => void
export type SocketAction = 'group' | 'call' | 'auth' | 'broadcast';

export interface WebSocketResponse {
    done  : boolean,
}

export type WebSocketClientFn = <S = any>(connectionOptions?:SocketConnectorOptions) => WebSocketClient<S>;

export interface WebSocketClient<S> {
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
