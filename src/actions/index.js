//actions
import firebase from '../firebase'
import axios from 'axios'
import {googServerKey, mapboxKey, googlePlacesKey} from '../secrets.js'
import history from '../history';
import googleMaps, {google} from '@google/maps'
import jsonp from 'jsonp';
import Geofire from 'geofire';
import secondsConverter from 'seconds-converter'

export const SET_ITINERARY = 'SET_ITINERARY'
export const GET_CURRENT_EVENTS = 'GET_CURRENT_EVENTS'
export const SELECT_ITINERARY = 'SELECT_ITINERARY'
export const ADD_EVENT = 'ADD_EVENT'
export const SET_USERS = 'SET_USERS'
export const SET_CURRENT_USER = 'SET_CURRENT_USER'
export const REFRESH = 'REFRESH'
export const CONNECT = 'CONNECT'
export const FETCH_USER_COOR = 'FETCH_USER_COOR'
export const FETCH_COOR_DISTANCE = 'FETCH_COOR_DISTANCE'
export const FETCH_COOR_TIME = 'FETCH_COOR_TIME'
export const FETCH_PLACES_COOR = 'FETCH_PLACES_COOR'
export const SET_USER_COOR = 'SET_USER_COOR'
export const SET_PLACES_COOR = 'SET_PLACES_COOR'
export const SET_COOR_DISTANCE = 'SET_COOR_DISTANCE'
export const SET_COOR_TIME = 'SET_COOR_TIME'
export const SEARCH_USER = 'SEARCH_USER'
export const UPDATE_USER = 'UPDATE_USER'
export const GET_ITINERARY_MEMBERS = 'GET_ITINERARY_MEMBERS'
export const PLACE_DETAILS = 'PLACE_DETAILS'
export const FETCH_LOCATION_NAMES = 'FETCH_LOCATION_NAMES'


const googleMapsClient = googleMaps.createClient({
    key: googServerKey,
    Promise: Promise
  })

                                                                                            // Used for adding a new itinerary to the database
export const postItinerary = (itinerary, itineraryImageURL) => dispatch => {
        const itinerariesRef = firebase.database().ref('itineraries')                       // Gets a reference to the 'itineraries' table in firebase
        const newRef = itinerariesRef.push({                                                // Pushes the new itinerary to firebase
            name: itinerary,
            owner: firebase.auth().currentUser.email,
            imageURL: itineraryImageURL,
            coordinates: {defaultCoor: {lat: 0, long: 0}},
            placeCoor: {defaultCoor: {lat: 0, long: 0}},
        })
        const newId = newRef.key;                                                             // Gets the PK from the newly created instance
                                                                                            // Creates a new object that resembles the one added to the database
                                                                                            // The only difference is that this object has the PK has a value; used in other functionality
        const itinObj = {
            key: newId,
            name: itinerary,
            owner: firebase.auth().currentUser.email
        }
        dispatch(setItinerary(itinObj))
        history.push(`/ideaboard/${newId}`);
        
}
                                                                                            // Used for getting all events for a certain itinerary from the database
export const fetchEvents = (itineraryKey, fromLike) => dispatch => {
    const itinKey = itineraryKey;
    // if (fromLike) {itinKey = itineraryKey}                                                     // If we are fetching events because there has been a new like, itinerary passed in will already be the key
    // else {itinKey = itinerary.key}
    const itinerariesRef = firebase.database().ref(`/itineraries/${itinKey}`)
                                                                                            // Gets a reference to the particular itinerary we are getting the events from
    itinerariesRef.once('value')                                                            // 'once' is used to read data from the reference             
        .then(snapshot => {
            const events = snapshot.val().events                                          // Get the events object from the reference
            let eventsArr = []
            for (let key in events) {                                                       // Loop adds an object to state array
                console.log('FETCH EVENT ', events)

                const toAdd = {
                    key: key,
                    added: events[key].added,
                    description: events[key].description,
                    image: events[key].image,
                    title: events[key].title,
                    url: events[key].url,
                    likes: events[key].likes,
                    likedBy: events[key].likedBy,
                    location: events[key].location,
                    comments: events[key].comments,
                    placeID: events[key].placeID
                    // address: events[key].gmaps.formatted_address,
                }
                eventsArr.push(toAdd)
            }
            return dispatch(setEvents(eventsArr))
        })
        .catch(err => console.log(err))
}
                                                                                            // Used when a new event is added to the itinerary's idea board
export const addEvent = (url, itinID) => dispatch => {
    axios.get(`https://api.linkpreview.net/?key=59ceb254e639805e71e929ab347575465baaf5072e1b1&q=${url}`)
        .then(res => res.data)
        .then(preview => {
            // let isFirstEvent = false
            // con newId
            const currentItinRef = firebase.database().ref().child('itineraries').child(itinID).child('events')
            console.log('add event ', preview)
            const newRef = currentItinRef.push({title: preview.title,
                description: preview.description,
                image: preview.image,
                url: preview.url,
                added: false,
                likes: 0,
                location: {
                    lat: 0,
                    lng: 0
                }
            })
            const newId = newRef.key
            const eventNode = {
                title: preview.title,
                description: preview.description,
                image: preview.image,
                url: preview.url,
                added: false, 
                key: newId,
                likes: 0,
                location: {
                    lat: 0,
                    lng: 0
                }
            }
        
            return dispatch(newEvent(eventNode))
        }).catch(err => console.log(err))
}

export const googlePlace = (suggest, itinID) => dispatch => {
    const currentItinRef = firebase.database().ref().child('itineraries').child(itinID).child('events')
            const newRef = currentItinRef.push({
                title: suggest.label,
                description: suggest.description,
                added: false,
                likes: 0,
                location: suggest.location,
                address: suggest.gmaps.formatted_address,
                placeID: suggest.placeId,
                })

            const newId = newRef.key

          
        const eventNode = {
            title: suggest.label,
            description: suggest.description,
            location: suggest.location,
            added: false, 
            key: newId,
            likes: 0,
            types: suggest.types,
            address: suggest.gmaps.formatted_address,
            placeID: suggest.placeId,
        }

        return dispatch(newEvent(eventNode))
}






export const setCurrentItinerary = (itinerary, itin) => dispatch => {
    const newRef = {
        name: itinerary.name,
        owner: itinerary.owner,
        key: itin,
        imageURL: itinerary.imageURL,
    }
    return dispatch(setItinerary(newRef))
}
                                                                                            // Used when someone likes an event
export const newLike = (eventId, itinKey) => dispatch => {
    const likedByRef = firebase.database().ref().child('itineraries').child(itinKey).child('events').child(eventId).child('likedBy')
    const likesRef = firebase.database().ref().child('itineraries').child(itinKey).child('events').child(eventId).child('likes')
    
    likesRef.transaction(likes => {                                                         // Updates the like counter in firebase
        return likes + 1
    })
    


    likedByRef.push({name: firebase.auth().currentUser.email})

    return dispatch(fetchEvents(itinKey, true))


}
                                                                                            // Used for moving an item from 'vote' to 'added
export const confirmEvent = (eventId, itinKey) => dispatch => {
    const addedRef = firebase.database().ref().child('itineraries').child(itinKey).child('events').child(eventId).child('added')
    addedRef.transaction(added => {                                                         // Updates its 'added' field to be true
        return true
    })
    return dispatch(fetchEvents(itinKey, true))
}

export const fetchUsers = () => dispatch => {
    const usersRef = firebase.database().ref().child('users')
    usersRef.once('value')
        .then(snapshot => {
            const users = snapshot.val()
            let usersArr = []
            for (let key in users) {
                const toAdd = {
                    key: key,
                    email: users[key].email,
                    name: users[key].name, 
                    image: users[key].image,
                    status: users[key].status,
                    localToken: users[key].localToken,
                    notifications: users[key].notifications
                }
                usersArr.push(toAdd)
            }
            return dispatch(setUsers(usersArr))
        })
        .catch(err => console.log(err))
}

export const sendFriendRequest = (user, friend) => dispatch => {
    const requestRef = firebase.database().ref().child('users').child(friend.key).child('requests')
    let isFirstRequest = false
    requestRef.transaction(requests => {
        if (requests === null) {
            isFirstRequest = true
            return {firstReq: {
                from: user.email,
                userKey: user.key,
                name: user.name
            }}
        }
    })
    if (!isFirstRequest) {
        requestRef.push({from: user.email, userKey: user.key, name: user.name})
    }

    const recipient = firebase.database().ref().child('users').child(friend.key);

    //push notifications for send friend request to itinerary
    recipient.once('value')
    .then(snapshot => {
        return snapshot.val().localToken
    })
    .then(userToken => {
        axios({ url: 'https://fcm.googleapis.com/fcm/send',
                method: 'post',
                headers: {
                    'Authorization': 'key=AAAA9J-m9SY:APA91bHXe_r13MYn-BY6iWZwXQ6tOmUZZv9UeMC7LfQdgGbxXKhbnoBWNQifh-2E-t9gVGFfaiKR_ivv1OtuBufWboAhJ5SeWNdrkWiQg6WNHY5b2DXSM4Sp4_rZO60y4Nq6BNjYUsk8',
                    'Content-Type': 'application/json',
                },
                data: {
                        "notification": {
                        "title": "Saffire",
                        "body": `${user.name} added you as a friend!`,
                        "icon": "firebase-logo.png",
                        "click_action": "https://deets-76612.firebaseapp.com/requests"
                        },
                        "to": userToken
                    }
        })
        .then(response => console.log('post sent', response.data))
    })
    .catch(err => console.log(err))

}



export const addFriend = (user, friend) => dispatch => {
            const currentUserRef = firebase.database().ref().child('users').child(user.key).child('friends')
            let isFirst = false
            currentUserRef.transaction(friends => {
                if (friends === null) {
                    isFirst = true
                    return {firstFriend: {
                        name: friend.name,
                        email: friend.email,
                        key: friend.key
                    }}
                }
            })
            if (!isFirst) {
                currentUserRef.push({
                    name: friend.name,
                    email: friend.email,
                    key: friend.key
                })
            }
            const friendRef = firebase.database().ref().child('users').child(friend.key).child('friends')
            isFirst = false
            friendRef.transaction(friends => {
                if (friends === null) {
                    isFirst = true
                    return {firstFriend: {
                        name: user.name,
                        email: user.email,
                        key: user.key
                    }}
                }
            })
            if (!isFirst) {
                friendRef.push({
                    name: user.name,
                    email: user.email,
                    key: user.key
                })
            }
        firebase.database().ref().child('users').child(user.key).child('requests').child(friend.reqKey).remove()


        const recipient = firebase.database().ref().child('users').child(friend.key);
        
            //push notifications for send friend request to itinerary
            recipient.once('value')
            .then(snapshot => {
                return snapshot.val().localToken
            })
            .then(userToken => {
                axios({ url: 'https://fcm.googleapis.com/fcm/send',
                        method: 'post',
                        headers: {
                            'Authorization': 'key=AAAA9J-m9SY:APA91bHXe_r13MYn-BY6iWZwXQ6tOmUZZv9UeMC7LfQdgGbxXKhbnoBWNQifh-2E-t9gVGFfaiKR_ivv1OtuBufWboAhJ5SeWNdrkWiQg6WNHY5b2DXSM4Sp4_rZO60y4Nq6BNjYUsk8',
                            'Content-Type': 'application/json',
                        },
                        data: {
                                "notification": {
                                "title": "Saffire",
                                "body": `${user.name} accepted you as a friend!`,
                                "icon": "firebase-logo.png",
                                "click_action": "https://deets-76612.firebaseapp.com/requests"
                                },
                                "to": userToken
                            }
                })
                .then(response => console.log('post sent', response.data))
            })
            .catch(err => console.log(err))

        return dispatch(getCurrentUser())
}






export const getCurrentUser = () => dispatch => {
    if (firebase.auth().currentUser) {
        
        const usersRef = firebase.database().ref().child('users')
        usersRef.once('value')
            .then(snapshot => {
                const users = snapshot.val()
                let loggedInUser = null
                for (let key in users) {
                    if (users[key].email === firebase.auth().currentUser.email){loggedInUser = {
                        key: key,
                        email: users[key].email,
                        friends: users[key].friends,
                        image: users[key].image,
                        name: users[key].name,
                        requests: users[key].requests,
                        status: users[key].status,
                        notifications: users[key].notifications
                    }}
                }

                return dispatch(setCurrentUser(loggedInUser))
            })
            .catch(err => console.log(err))
    }
    else {
        return dispatch(setCurrentUser({}))
    }
}


export const searchForUser = (searchEmail) => dispatch => {
        const usersRef = firebase.database().ref().child('users')
        usersRef.once('value')
            .then(snapshot => {
                const users = snapshot.val()
                let foundUser = null;
                let foundUserID = '';
                for (let key in users) {
                    if (users[key].email === searchEmail) {
                        foundUser = users[key];
                        foundUserID = key;
                    }
                }

                if (!foundUser) {
                    return;
                }

                const userCred = {
                    name: foundUser.name,
                    email: foundUser.email,
                    key: foundUserID,
                }

                return dispatch(searchedUser(userCred))
            })
            .catch(err => console.log(err))
}



export const onUserListener = (user) => dispatch => {
    const usersRef = firebase.database().ref().child('users')
    usersRef.once('value')
    .then(snapshot => {
        const users = snapshot.val()
        const localToken = window.localStorage.getItem('localUserToken');
        let loggedInUser = {};

        for (let key in users) {
            if (users[key].email === user.email){
                const usersRefChild = firebase.database().ref().child('users').child(key).child('localToken')
                usersRefChild.transaction((tokenKey) => {
                    return localToken
                })
    
                loggedInUser = {
                key: key,
                email: users[key].email,
                friends: users[key].friends,
                image: users[key].image,
                status: users[key].status,
                name: users[key].name,
                requests: users[key].requests,
                notifications: users[key].notifications
            }}

        }

        return dispatch(setCurrentUser(loggedInUser))
    }).catch(err => console.log(err))
}


export const addToItinerary = (itinID, user) => dispatch => {


    const itinRef = firebase.database().ref().child('itineraries').child(itinID).child('members')
    const recipient = firebase.database().ref().child('users').child(user)

    //push notifications for add friend to itinerary
    recipient.once('value')
    .then(snapshot => {
        return snapshot.val().localToken
    })
    .then(userToken => {
        axios({ url: 'https://fcm.googleapis.com/fcm/send',
                method: 'post',
                headers: {
                    'Authorization': 'key=AAAA9J-m9SY:APA91bHXe_r13MYn-BY6iWZwXQ6tOmUZZv9UeMC7LfQdgGbxXKhbnoBWNQifh-2E-t9gVGFfaiKR_ivv1OtuBufWboAhJ5SeWNdrkWiQg6WNHY5b2DXSM4Sp4_rZO60y4Nq6BNjYUsk8',
                    'Content-Type': 'application/json',
                },
                data: {
                        "notification": {
                        "title": "Saffire",
                        "body": "You've been added to a new itinerary! Click to view.",
                        "icon": "firebase-logo.png",
                        "click_action": "https://deets-76612.firebaseapp.com/"
                        },
                        "to": userToken
                    }
        })
        .then(response => console.log('post sent', response.data))
    })
    .catch(err => console.log(err))

    let isFirst = false
    itinRef.transaction(members => {
        if (members === null){
            isFirst = true
            return {firstMember: {
                key: user
            }}
        }
    })

    if (!isFirst) {
        itinRef.push({key: user})
    }

}

export const updateStatus = (user, status) => dispatch => {
    const statusRef = firebase.database().ref().child('users').child(user.key).child('status')
    statusRef.transaction(oldStatus => {
        return status
    })

}

export const setDateAndTime = (itinId, event, date, time, toSchedule) => dispatch => {
    const eventRef = firebase.database().ref().child('itineraries').child(itinId).child('events')
    let dateToAdd = date + ''
    dateToAdd = dateToAdd.substr(0, dateToAdd.indexOf('2017'))
    let timeToAdd = time + ''
    timeToAdd = timeToAdd.substr(timeToAdd.indexOf(":") - 2, timeToAdd.length)
    eventRef.once('value')
        .then(snapshot => {
            const events = snapshot.val()
            for (let key in events) {
                if (events[key].title === event.title){
                    return key
                }

            }
        })
        .then(theKey => {
            const evRef = firebase.database().ref().child('itineraries').child(itinId).child('events').child(theKey).child('schedule').update({date: dateToAdd, time: timeToAdd, toSchedule: toSchedule})
        })
        .then(() => {
            dispatch(causeRefresh('setDateAndTime'))
        })
}



export const postUserCoordinates =  itin => dispatch => {
    const coorRef = firebase.database().ref().child('itineraries').child(itin).child('coordinates')
    const noCoorRef = firebase.database().ref().child('itineraries').child(itin)
    noCoorRef.once('value')
    .then(result => {
        let payload = [];

        if (!navigator.geolocation){
            //output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
            return;
          }

        function success(position) {
            console.log('success hit')
            let latitude = position.coords.latitude
            let longitude = position.coords.longitude
            payload.push(longitude, latitude)
            console.log('payload', payload)

            let fireRef = firebase.database().ref().child('itineraries').child(itin)
            fireRef.child('coordinates').push({lat: payload[0], long: payload[1]})
           
            }
        
          function error() {
            console.log('sorry no geolocator')
            //output.innerHTML = "Unable to retrieve your location";
           
          }
        
          //output.innerHTML = "<p>Locating…</p>";
          navigator.geolocation.getCurrentPosition(success, error)
          return payload;
         })
    .then(userLocation => {
        dispatch(setUserCoor(userLocation))
    })
    .catch(err => {
        console.log(err)
    })
}


export const postGeoLocation = itin => dispatch => {
    const userRef = firebase.database().ref().child('itineraries').child(itin).child('coordinates')
    axios.post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${googServerKey}`)
    .then(result => {
        let locationArr = Object.keys(result.data.location)
        let locationObj = result.data.location
        console.log('location***', result.data.location)
        let resultArr =[]
        resultArr.push(Number(locationObj[locationArr[1]]), Number(locationObj[locationArr[0]]))
        console.log('resultArr', resultArr)
        return resultArr
    })
    .then(resultArray => {
        userRef.push({lat: resultArray[0], long: resultArray[1]})
    })
    .catch(err => {
        console.log(err)
    })}

export const sendMessage = (user, itinKey, message) => {
    const messageRef = firebase.database().ref().child('itineraries').child(itinKey).child('messages')
    messageRef.push({
        sender: user.name,
        content: message,
    })
    const newMessageRef = firebase.database().ref().child('itineraries').child(itinKey).child('newMessage').child('currentMessage')
    newMessageRef.transaction(newMessageRef => {
        return message

    })
}


export const fetchTimeMatrix = (userCoor, locations) => dispatch => {
    
    let origin = `${userCoor[0]},${userCoor[1]}`
    let destinations = locations.map(location => {
        return `${location[0]},${location[1]}`
    }).join(';')

    // let googOrigin = [userCoor[0], userCoor[1]]
    // let googDestination = locations.map(location => {
    //     return [location[1] ,location[0]]
    // })

    // console.log('orign***', origin)
    // console.log('destinations****', destinations)


    axios.get(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${origin};${destinations}?sources=0&destinations=all&access_token=${mapboxKey}`)
    .then(res => res.data)
    .then(payload => {
        let durationsArr = payload.durations.map((duration) => {
            return duration
        })
        return durationsArr
    })
    .then(results => {
        // dispatch(fetchCoorTime(results))
        return results[0].map((result , i) => {
            return secondsConverter(result, 'sec')
        })
    })
    .then(converts => {
        dispatch(fetchCoorTime(converts))
    })
    .catch(error => {
        console.log(error)
    })

    // console.log('geofire distance', Geofire.distance(userCoor, locations[0]))
    

}

export const fetchDistanceMatrix = (userCoor, locations) => dispatch => {
    // let geoDistances = locations.map(location => {
    //     return Geofire.distance(userCoor, location)
    // })
    // console.log('geofireLocationssss', geoDistances)
    //dispatch(fetchCoorDistance(geoDistances))

}

export const getUserCoordinates = userCoor => dispatch => {
    dispatch(fetchUserCoor(userCoor))
}

export const getLocationNames = key => dispatch => {
    let eventsRef = firebase.database().ref().child('itineraries').child(key.id).child('events')
    eventsRef.once('value')
    .then(snapshot => {
        let objSnap = Object.keys(snapshot.val())
        console.log('snapshotval', snapshot.val())
        let events = []
         objSnap.forEach(snap => {
            events.push(snapshot.val()[snap].address)
        })
        return events
    })
    .then(res => {
        dispatch(fetchLocationNames(res))
    })
}

export const removeSchedule = (itin, event) => dispatch => {
    const itinRef = firebase.database().ref().child('itineraries').child(itin)
    itinRef.once('value')
        .then(snapshot => {
            const itinerary = snapshot.val()
            for (let key in itinerary.events) {
                if (itinerary.events[key].title === event.title){return key}
            }
        })
        .then(eventKey => {
            itinRef.child('events').child(eventKey).child('schedule').remove()
        })
}

export const addToNotifications = body => dispatch => {
    const userRef = firebase.database().ref().child('users')
    userRef.once('value')
        .then(snapshot => snapshot.val())
        .then(users => {
            for (let key in users) {
                if (users[key].email === firebase.auth().currentUser.email){return key}
            }
        })
        .then(userKey => {
            const currentUserRef = firebase.database().ref().child('users').child(userKey).child('notifications')
            currentUserRef.push({body: body, time: new Date()})
        })
}

export const removeNotification = (user, body) => dispatch => {
    const requestRef = firebase.database().ref().child('users').child(user.key).child('notifications')
    requestRef.once('value')
        .then(snapshot => snapshot.val())
        .then(requests => {
            for (let key in requests) {
                if (requests[key].body === body){return key}
            }
        })
        .then(reqKey => {
            firebase.database().ref().child('users').child(user.key).child('notifications').child(reqKey).remove()
            dispatch(getCurrentUser())
        })
        .catch(err => console.log(err))
}

export const getItineraryMembers = itinKey => dispatch => {
    const itinRef = firebase.database().ref().child('itineraries').child(itinKey).child('members')
    itinRef.once('value')
        .then(snapshot => snapshot.val())
        .then(members => {
            const membersArray = []
            if (members) {
                Object.keys(members).map(key => {
                    firebase.database().ref().child('users').child(members[key].key).once('value')
                        .then(snapshot => membersArray.push(snapshot.val()))
                })
                return membersArray
            }
            else { 
                return []
            }
        })
        .then(membersArray => dispatch(setItinerayMembers(membersArray)))
        .catch(err => console.log(err))
}




export const googlePlacesDetails = (placeid) => dispatch => {
    const placesDetails = axios.post(`https://us-central1-deets-76612.cloudfunctions.net/helloWorld?placeid=${placeid}`);

        placesDetails
        .then(res => {
            dispatch(googlePlaceDetails(res.data))
        })
        .catch(err => console.log(err));
}

export const sendComment = (itinKey, eventKey, currentUser, body) => dispatch => {
    firebase.database().ref().child('itineraries').child(itinKey).child('events').child(eventKey).child('comments').push({
        sender: currentUser.name,
        body: body
    })
}

      

export const updateUser = (newName, newEmail, newPassword, userID) => dispatch => {
    const authUser = firebase.auth().currentUser;
    const selectedUser = firebase.database().ref().child(`users/${userID}`);
    const newData = {
        name : newName,
        email: newEmail,
        
    }
    selectedUser.update(newData);
    return authUser.updateEmail(newEmail)
    .then( () => {
        return authUser.updatePassword(newPassword)
    })
    .then(() => {
        return dispatch(getCurrentUser())
    })
        .catch(err => console.log(err))
}

//action creator

export const setItinerary = itineraryName => ({type: SET_ITINERARY, itineraryName});
export const setEvents = events => ({type: GET_CURRENT_EVENTS, events})
export const newEvent = event => ({type: ADD_EVENT, event})
export const setUsers = users => ({type: SET_USERS, users})
export const setCurrentUser = user => ({type: SET_CURRENT_USER, user})
export const causeRefresh = message => ({type: REFRESH, message})
export const connectionChange = status => ({type: CONNECT, status})
export const fetchUserCoor = coor => ({type: FETCH_USER_COOR, coor})
export const fetchPlacesCoor = coors => ({type: FETCH_PLACES_COOR, coors})
export const fetchCoorTime = times => ({type: FETCH_COOR_TIME, times})
export const fetchCoorDistance = distances => ({type: FETCH_COOR_DISTANCE, distances})
export const fetchLocationNames = locations =>({type: FETCH_LOCATION_NAMES, locations})
export const searchedUser = user => ({type: SEARCH_USER, user});
export const setUserCoor = coor => ({type: SET_USER_COOR, coor})
export const setPlacesCoor = coors => ({type: SET_PLACES_COOR, coors})
export const setCoorDistance = distances => ({type: SET_COOR_DISTANCE, distances})
export const setCoorTime = times => ({type: SET_COOR_TIME, times})
export const updatedUser = newUpdatedUser => ({type: UPDATE_USER, newUpdatedUser})
export const setItinerayMembers = members => ({type: GET_ITINERARY_MEMBERS, members})
export const googlePlaceDetails = details => ({type: PLACE_DETAILS, details});



