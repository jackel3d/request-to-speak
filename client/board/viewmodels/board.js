/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler", "moment"], function(http, app, observable, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        requests: [],
        newRequests: [],
        requestList: [],
        requestSort: "",
        totalTimeRemaining: 0,
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "board");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
                this.requests = message.meeting.requests;
            } else {
                this.isMeetingActive = false;
                this.requests = [];
            }
            this.updateList();
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
                this.requests = message.meeting.requests;
            } else {
                this.isMeetingActive = false;
                this.requests = [];
            }
            this.updateList();
        },
        requestMessage: function(message) {
            var requests = this.requests;
            if(message.event === "add") {
                requests.push(message.request);
                this.newRequests.push(message.request);
            } else {
                requests.splice(requests.findIndex(function(r) {
                    return r.requestId === message.request.requestId;
                }), 1);
            }
        }
    };

    ret.format = function(date) {
        return moment(date).format("HH:mm:ss A");
    };

    ret.updateList = function() {
        // trunc newMessages array
        this.newRequests.length = 0;
        // start with a distinct list of items.
        var requests = this.requests;
        var allItems = requests.map(function(request) {
            return request.item;
        });
        var items = allItems.filter(function(value, index, self) {
            return self.findIndex(function(i) {
                return value.itemId === i.itemId;
            }) === index;
        });

        // add requests and sum time to speak
        items.forEach(function(i) {
            i.requests = requests.filter(function(r) {
                return r.item.itemId === i.itemId;
            });
            if(i.requests) {
                i.timeRemaining = i.requests.reduce(function(a, b) {
                    return a + b.timeToSpeak;
                }, 0);
            } else {
                i.timeRemaining = 0;
            }
        });

        this.requestList = items;

        this.totalTimeRemaining = this.requestList.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        }, 0);
    }.bind(ret);

    return ret;
});
