import { SocketFn, SocketListeners, SocketPackage, SocketPackageData, SocketPackageInfo, SocketPackageResponse, SocketServerCallsStack } from "./types";

export const CreateBrowserClientSocket = (url:string,onError:(data:any) => void = console.log) => {
    let webSocket:WebSocket                   = null
    let packageID:number                      = 0;
    let session  :SocketPackageData | null    = null;
    let calls    :SocketServerCallsStack      = {};
    let listeners:SocketListeners             = {};
    let mainAuthData:SocketPackageData | null = null;
    let authFailed:boolean                    = false;
    let onLogin: SocketFn |null               = null


    const Connect = (t:number = 2_000) => {
        if(authFailed ) return;

        setTimeout(() => {
          console.log('reconnecting...');
          try {
              if(webSocket != null){
                webSocket.onclose = () => {};
                webSocket.onerror = () => {};
                webSocket.onopen  = () => {};
                webSocket.onmessage = () => {};
                webSocket.close();
              }
              webSocket = new WebSocket(url);
              packageID  = 0;
              session    = null;
              calls      = {};
              listeners  = {};
              AppendListeners();
          } catch(e){
              console.log('error reconnecting...');
              console.log(e);
          }
      },t);
    }


    const AuthLoginServer = (cb:SocketFn) => {
        let info: SocketPackageInfo = {
            action   : 'auth',
            request  : 'login',
            group    : '',
            packageID: packageID
        }
        let obj:SocketPackage = {
            data:mainAuthData,
            info:info
        }
        calls[packageID] = cb;
        webSocket.send(JSON.stringify(obj));
        packageID++;
    }

    const AppendListeners = () =>{
        webSocket.onerror =  e => {
            onError(e);
            setTimeout(() => { Connect(); }, 2_000);
            webSocket.close();
        };
        webSocket.onclose = e => {
            console.log('error...');
            onError(e);
            setTimeout(() => { Connect(); }, 2_000);
            webSocket.close();
        };
        webSocket.onopen =  () => {
            AuthLoginServer((error,sessionData) => {
                if(error){
                    session = null;
                    authFailed = true;
                    onLogin(error,{});

                } else {
                    session = sessionData;
                    onLogin(null,sessionData);
                }
            });
        };
        webSocket.onmessage = function incoming(xMsg) {
            let incomingData:string = xMsg.data;
            try {
                let r:SocketPackageResponse = JSON.parse(incomingData);
                let { info,error,response } = r;
                if(info.action == "broadcast"){
                    let { request } = info;
                    if(listeners[request]) listeners[request].forEach(fn => fn(error,response));
                } else {
                    if(info.action == "call" || info.action == "group" || info.action == "auth"){
                        let { packageID } = info;
                        if(calls[packageID]){
                            calls[packageID](error,response);
                            delete calls[packageID];
                        }
                    }
                }
            } catch (e) {
                onError( 'invalid data: ' + incomingData);
            }
        };
    }

    const MakeRequest = (request:string | number,data:SocketPackageData,cb:SocketFn) => {
        if(session){
            let info: SocketPackageInfo = {
                action   : 'call',
                request  : request,
                group    : '',
                packageID: packageID
            }
            let obj:SocketPackage = {
                data:data,
                info:info
            }
            calls[packageID] = cb;
            webSocket.send(JSON.stringify(obj));
            packageID++;
        } else {
            cb('not authenticated',{});
        }
    }

    const JoinGroup = (group:string,cb:SocketFn) => {
        if(session){
            let info: SocketPackageInfo = {
                action   : 'group',
                request  : 'join',
                group    : group,
                packageID: packageID
            }
            let obj:SocketPackage = {
                data:{},
                info:info
            }
            calls[packageID] = cb;
            webSocket.send(JSON.stringify(obj));
            packageID++;
        } else {
            cb('not authenticated',{});
        }
    }

    const LeaveGroup = (group:string,cb:SocketFn) => {
        if(session){
            let info: SocketPackageInfo = {
                action   : 'group',
                request  : 'leave',
                group    : group,
                packageID: packageID
            }
            let obj:SocketPackage = {
                data:{},
                info:info
            }
            calls[packageID] = cb;
            webSocket.send(JSON.stringify(obj));
            packageID++;
        } else {
            cb('not authenticated',{});
        }
    }

    const LeaveAllGroups = (cb:SocketFn) => {
        if(session){
            let info: SocketPackageInfo = {
                action: 'group',
                request: 'leaveAll',
                group: '',
                packageID: packageID
            }
            let obj:SocketPackage = {
                data:{},
                info:info
            }
            calls[packageID] = cb;
            webSocket.send(JSON.stringify(obj));
            packageID++;
        } else {
            cb('not authenticated',{});
        }
    }

    const On = (name:string,cb:SocketFn) => {
        if(!listeners[name]) listeners[name] = [];
        listeners[name].push(cb);
    }

    const Logout = (cb:SocketFn) => {
        authFailed = true;
        let info: SocketPackageInfo = {
            action   : 'auth',
            request  : 'logout',
            group    : '',
            packageID: packageID
        }
        let obj:SocketPackage = {
            data:{},
            info:info
        }
        calls[packageID] = cb;
        webSocket.send(JSON.stringify(obj));
        packageID++;
    }

    const ConnectAndAuthenticate = (newAuthData:SocketPackageData,newOnLogin:SocketFn) => {
      authFailed = false;
      mainAuthData = newAuthData;
      onLogin = newOnLogin;
      Connect(1);
    }


    let result: SocketConnector = {
      MakeRequest,
      JoinGroup,
      LeaveGroup,
      LeaveAllGroups,
      On,
      Logout,
      ConnectAndAuthenticate
    }

    return result
}

export interface SocketConnector {

    MakeRequest(request:string | number,data:SocketPackageData,cb:SocketFn):void;
    JoinGroup(group:string,cb:SocketFn):void;
    LeaveGroup(group:string,cb:SocketFn):void;
    LeaveAllGroups(cb:SocketFn):void;
    On(name:string,cb:SocketFn):void;
    Logout(cb:SocketFn):void;
    ConnectAndAuthenticate(newAuthData:SocketPackageData,newOnLogin:SocketFn):void;
}
