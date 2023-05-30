interface SocketPackage {
    info: SocketPackageInfo,
    data: any
}
interface SocketPackageInfo {
    action   : SocketAction
    request  : string | number,
    group    : string,
    packageID: number
}
interface SocketPackageResponse {
    info    : SocketPackageInfo,
    error   : any,
    response: any
}
interface SocketServerCallsStack {
    [key: number]:  (error: any, response: any) => void
}
interface SocketListeners {
    [key: string]:  ((response: any) => void)[]
}

type SocketAction = 'group' | 'call' | 'auth' | 'broadcast' | 'channel';
interface SocketConnectorOptions {
    onConnectionErrorReconnect?: boolean,
    authCallbackOnReconnect?   : boolean,
    reconnectionTimeout?       : number,
}
export class WebSocketBrowserClient {
    public webSocket: WebSocket = null;
    private packageID: number    = 0;
    private _session  : any       = null

    private onServerResponse:SocketServerCallsStack = {};
    private broadcastListeners :SocketListeners     = {};

    private authCredentials:any     = {};
    private url:string              = null;
    private reconnect: boolean      = true;
    private hasBeingConnectedBefore = false;

    private onConnectionErrorReconnect :boolean = true;
    private authCallbackOnReconnect    :boolean = true;
    private reconnectionTimeout        :number  = 2_000;

    private _onConnectionError :(error: any, info: any) => void         = console.error;
    private _onConnectionClose :(error: any, info: any) => void         = console.log;
    private _whenConnected :() => void                                 = () => {};
    private _ifAuthenticationFails :(authenticationError: any) => void = () => {};

    private log :(msg:any ) => void | null = null;
   
    constructor(connectionOptions:SocketConnectorOptions = null,Log: (msg:any ) => void | null= null) {
        if(connectionOptions){
            this.onConnectionErrorReconnect = connectionOptions.onConnectionErrorReconnect || this.onConnectionErrorReconnect;
            this.authCallbackOnReconnect    = connectionOptions.authCallbackOnReconnect    || this.authCallbackOnReconnect;
            this.reconnectionTimeout        = connectionOptions.reconnectionTimeout        || this.reconnectionTimeout;
        }
        this.log = Log;
    }

    private ReloadConnection = (reconnectionWait:number = this.reconnectionTimeout) => {
        if(this.reconnect ) {
            setTimeout(() => {
                try {
                    this.ClearWebSocket();
                    this.StartSocket();                
                } catch(e){
                    this._onConnectionError('connection error',e);
                }
            },reconnectionWait);
        }
    }

    private ResetControllers = () => {
        this.packageID          = 0;
        this._session            = null;
        this.onServerResponse   = {};
        this.broadcastListeners = {};
    }

    private StartSocket = () => {
        this.webSocket           = new WebSocket(this.url);
        this.webSocket.onerror   = this.onConnError;         // error
        this.webSocket.onclose   = this.onConnClose ;        // close
        this.webSocket.onopen    = this.onConnOpen;
        this.webSocket.onmessage = this.onConnMessage;
    }

    private ClearWebSocket = () => {
        if(!this.webSocket) return; 
        this.webSocket.onclose   = () => {};
        this.webSocket.onerror   = () => {};
        this.webSocket.onopen    = () => {};
        this.webSocket.onmessage = () => {};
        this.webSocket.close();
        this.webSocket = null;
    }

    private onConnError = (e:any) => {
        this._onConnectionError('connection error',e);
        if (this.onConnectionErrorReconnect) this.ReloadConnection();
    }

    private onConnClose = (e:any) => {
        if (this.session) this._onConnectionClose('connection closed',e);
    }

    private onConnMessage = (xMsg:any) => {
        if(this.log) this.log(xMsg);
        let packageResponse:SocketPackageResponse = null;
        try {
            packageResponse = JSON.parse(xMsg.data);
        } catch (e) {
            this._onConnectionError( 'invalid incoming data: ', xMsg.data);
        }
        this.HandleServerMessage(packageResponse);
    }

    private onConnOpen = () => {
        this.Send<any>('auth','login',null,this.authCredentials,(error,sessionData) => {
            if(error){
                this._session   = null;
                this.reconnect = false;
                this._ifAuthenticationFails(error);
            } else {
                this._session = sessionData;
                if (this.hasBeingConnectedBefore) {
                    if (this.authCallbackOnReconnect) this._whenConnected();
                } else {
                    this.hasBeingConnectedBefore = true;
                    this._whenConnected();
                }
            }
        });
    }

    private HandleServerMessage = (r:SocketPackageResponse) => {
        let { info,error,response } = r;
        if(info.action == "broadcast"){
            let { request } = info;
            if(this.broadcastListeners[request]) {
                let listeners = this.broadcastListeners[request];
                listeners.forEach(fn => fn(response));
            }
        } else {
            let isServerResponse = info.action == "call" || info.action == "group" || info.action == "auth" || info.action == "channel";
            if(isServerResponse){
                let { packageID } = info;
                if(this.onServerResponse[packageID]){
                    let onResponseToPackage = this.onServerResponse[packageID];
                    onResponseToPackage(error,response);
                    delete this.onServerResponse[packageID];
                }
            }
        }
    }

    private Send = <T = any> (action:SocketAction,request:string | number,group:string = '',data:any = null,cbOnResponse:(error: any, response: T) => void  = null) => {
        if(this._session || (action == 'auth' && request == 'login')){
            let info: SocketPackageInfo = { action,request,group,packageID:this.packageID } ;
            let body:SocketPackage      = { info, data}
            if(cbOnResponse) {
                this.onServerResponse[this.packageID] = cbOnResponse;
                this.packageID++;
            }
            this.webSocket.send(JSON.stringify(body));
        } else {
            cbOnResponse('not authenticated',null);
        }
    }

    public connectTo = <T = any>(websocketServerURL:string,newAuthCredentials:T = null) => {
        let u = websocketServerURL;
        if(u.startsWith('http://'))  u = u.replace('http://','ws://')
        if(u.startsWith('https://')) u = u.replace('https://','wss://')
        if(u.startsWith('/') ) u = 'ws://' + window.location.hostname + u;
        this.url                      = u;
        this.reconnect                = true;
        this.hasBeingConnectedBefore  = false;
        this.authCredentials          = newAuthCredentials || this.authCredentials;
        this.ReloadConnection(1);
        return this;
    }

    public echo = <T = any>(data:T,cb:(error: any, response: {echoAt:number,received:T}) => void = null) => {
        this.Send<{echoAt:number,received:T}>('call','echo',null,data,cb);
    }

    public request = <T = any,R= any>(request:string | number,data:R,cb:(error: any, response: T) => void = null) => {
        this.Send('call',request,null,data,cb);
    }

    public joinGroup = (group:string,cb:(error: any, response: {done:boolean}) => void = null) => {
        this.Send('group','join',group,null,cb);
    }

    public leaveGroup = (group:string,cb:(error: any, response: {done:boolean}) => void = null) => {
        this.Send('group','leave',group,null,cb);
    }

    public leaveAllGroups = (cb:(error: any, response: {done:boolean}) => void = null) => {
        this.Send('group','leaveAll',null,null,cb);
    }

    public onMessageReceived = <T = any>(subject:string,cb:(incomingData: T) => void) => {
        if(!this.broadcastListeners[subject]) this.broadcastListeners[subject] = [];
        this.broadcastListeners[subject].push(cb);
    }

    public getAvailableClients = (cb:(error: any, response: {uuid:string,publicAlias:string}[]) => void = null) => {
        this.Send('channel','getAvailableClients',null,null,cb);
    }

    public updatePublicAlias = (publicAlias:string,cb:(error: any, response: {currentAlias:string}) => void = null) => {
        this.Send('channel','updatePublicAlias',null,{publicAlias},cb);
    }

    public getPublicAlias = (cb:(error: any, response: {currentAlias:string}) => void = null) => {
        this.Send('channel','getPublicAlias',null,{},cb);
    }

    public updatePublicAvailability = (isAvailable:boolean,cb:(error: any, response: {currentAvailability:boolean}) => void = null) => {
        this.Send('channel','updatePublicAvailability',null,{isAvailable},cb);
    }

    public getPublicAvailability = (cb:(error: any, response: {currentAvailability:boolean}) => void = null) => {
        this.Send('channel','getPublicAvailability',null,{},cb);
    }

    public sentToClient = <T = any>(uuid:string,data:T,cb:(error: any, response: {sent:boolean}) => void = null) => {
        this.Send('channel','sendToClient',uuid,data,cb);
    }

    public onClientMessageReceived = <T = any>(cb:(incomingData: {fromUUID:string,data:T}) => void) => {
        this.onMessageReceived<{fromUUID:string,data:T}>('msgFromClient',cb);
    }

    public Broadcast = <T = any>(subject:string,group:string| null,data:T) => {
        this.Send('broadcast',subject,group,data,null);
    }

    public get close (){
        this.reconnect = false;
        this.ClearWebSocket();
        this.ResetControllers();
        return null;
    }

    public set onConnectionError(oce: (error:any,info:any) => void) {
        this._onConnectionError = oce;
    }

    public set onConnectionClosed(occ: (error:any,info:any) => void) {
        this._onConnectionClose = occ;
    }

    public set ifAuthenticationFails(oaf: (authenticationError:any) => void) {
        this._ifAuthenticationFails = oaf;
    }

    public set whenConnected(oc: () => void) {
        this._whenConnected = oc;
    }

    public get session(){
        return this._session;
    }

    public get isConnected(){
        return this._session != null;
    }
}