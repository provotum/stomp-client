var Stomp = require('./lib/stomp-websocket/stomp.js');
var SockJS = require('./lib/sock-js/sockjs');

/**
 * @param host The hostname including any port information, if necessary. E.g. http://localhost:8080
 * @param service The service name to connect on the specified host. Must start with a forward slash. E.g. /websocket
 * @returns {{connect: connect, isConnected: isConnected, disconnect: disconnect, send: send, subscribe: subscribe}}
 * @constructor
 */
function StompClient(host, service) {

    var stompClient = null;

    return {
        connect: connect,
        isConnected: isConnected,
        disconnect: disconnect,
        send: send,
        subscribe: subscribe
    };

    /**
     * Connect to the endpoint.
     *
     * @param successCallback A callback called upon successful connection.
     * @param errorCallback A callback called upon failed connection attempt.
     */
    function connect(successCallback, errorCallback) {
        if (null !== stompClient) {
            // client is already configured
            return;
        }

        var headers = {};
        var socket = new SockJS(host + service);

        stompClient = Stomp.Stomp.over(socket);
        stompClient.connect(headers, successCallback, errorCallback);
    }

    /**
     * @returns {boolean} True, if a connection is currently established.
     */
    function isConnected() {
        return null !== stompClient;
    }

    /**
     * Disconnect the client from the endpoint.
     *
     * @param callback A callback invoked after having disconnected.
     */
    function disconnect(callback) {
        if (null === stompClient) {
            // not initialised
            return;
        }

        stompClient.disconnect(callback);
        stompClient = null;
    }

    /**
     * Send the given payload to the specified endpoint.
     *
     * @param endpoint An endpoint relative to the host configured.
     * @param payload The payload to send. Will be converted to a JSON string, if not string already.
     * @param callback A callback invoked after the payload was sent.
     */
    function send(endpoint, payload, callback) {
        if (null === stompClient) {
            throw Error("Client must be configured before sending.");
        }

        if (typeof payload !== 'string' && !(payload instanceof String)) {
            payload = JSON.stringify(payload);
        }
        stompClient.send(endpoint, {}, payload);

        if (callback) {
            callback();
        }
    }

    /**
     * Subscribe to a topic at the given endpoint.
     *
     * @param endpoint The endpoint to which to subscribe. Relative to the host configured.
     * @param successCallback A callback called upon successful data retrieval. Will receive as first argument an object containing the response.
     * @param errorCallback A callback invoked if an invalid message is retrieved. Will receive as first argument the plain data.
     */
    function subscribe(endpoint, successCallback, errorCallback) {
        if (null === stompClient) {
            throw Error("Client must be configured before subscribing.");
        }

        stompClient.subscribe(endpoint, function (data) {
            if (data.body) {
                if (successCallback) {
                    successCallback(JSON.parse(data.body));
                }
            } else {
                if (errorCallback) {
                    errorCallback(data);
                }
            }
        });
    }
}

module.exports = StompClient;
