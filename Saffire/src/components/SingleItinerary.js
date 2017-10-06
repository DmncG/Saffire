
import React, {Component} from 'react';
import {connect} from 'react-redux';
import firebase from '../firebase'
import TimePicker from 'material-ui/TimePicker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import DatePicker from 'material-ui/DatePicker';
import {setDateAndTime, sendMessage, fetchUsers} from '../actions'
import BurgerMenu from './Menu';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import Avatar from 'material-ui/Avatar';
import {MapComp} from '../components'

import {
    blue300,
    indigo900,
    orange200,
    deepOrange300,
    pink400,
    purple500,
  } from 'material-ui/styles/colors';





class SingleItinerary extends Component{
    constructor(props) {
        super(props)
        this.state = {
            itin: {},
            showForm: {},
            currentTime: '',
            currentDate: '',
            showChat: false,
            chatMessage: ''
        }
        this.renderForm = this.renderForm.bind(this)
        this.submitEvent = this.submitEvent.bind(this)
        this.sendChat = this.sendChat.bind(this)
}

    componentDidMount() {
        const itinRef = firebase.database().ref().child('itineraries').child(this.props.match.params.id)
        itinRef.once('value')
            .then(snapshot => {
                this.setState({itin: snapshot.val()})
            })
    }

    renderForm(event) {
        if(!this.state.showForm.title){this.setState({showForm: event})}
        else {this.setState({showForm: {}})}
    }

    submitEvent(e) {
        e.preventDefault()
        this.props.setDateAndTime(this.props.match.params.id, this.state.showForm, this.state.currentDate, this.state.currentTime)
        this.setState({showForm: {}})
    }

    sendChat(e) {
        e.preventDefault()
        this.props.sendMessage(this.props.user, this.props.match.params.id, this.state.chatMessage)
        this.setState({chatMessage: ''})
    }

    render() {
        const memberArray = []
        for (let i in this.state.itin.members) {
            let toAdd = this.props.users.filter(currentUser => (currentUser.key === this.state.itin.members[i].key))
            // memberArray.push(this.props.user[this.props.user.indexOf(this.state.itin.members[i].key]))
            memberArray.push(toAdd[0])
        }
        const ownerAdd = this.props.users.filter(currentUser => currentUser.email === this.state.itin.owner)
        memberArray.push(ownerAdd[0])
        console.log('MEMBERS: ', memberArray)
        /*
            FIREBASE EVENT LISTENERS
         =========================================================================================================================================================
        */
        const eventRef = firebase.database().ref().child('itineraries').child(this.props.match.params.id).child('events')
        eventRef.on('child_changed', (data) => {
            const val = data.val()
            const itin = this.state.itin
            for (let key in this.state.itin.events) {
                if (this.state.itin.events[key].url === val.url) {
                    this.state.itin.events[key].schedule = val.schedule
                }
            }
            this.setState({itin: itin})
        })

            memberArray.map(member => {
                if (member) {
                const userRef = firebase.database().ref().child('users').child(member.key)
                userRef.on('child_changed', data => {
                    if(typeof data.val() === 'string') {
                        this.props.loadInitialData()
                    }
                })
            }
            })


        /*
        =========================================================================================================================================================
            END FIREBASE EVENT LISTNERS
        */

        const messageRef = firebase.database().ref().child('itineraries').child(this.props.match.params.id).child('messages')
        const chatMessages = []
        messageRef.limitToLast(1).on('child_added', (data) => {
            const val = data.val()
            console.log('***************', val)
            // // chatMessages.push(val)
            // // this.forceUpdate()
            // const itin = this.state.itin
            // const tmp = []
            // for (let i in this.state.itin.messages) {
            //     tmp.push(this.state.itin.messages[i])
            // }
            // // if (!tmp.includes(data) && this.state.itin.messages) {
            // //     itin.messages.newMessage = val
            // //     this.setState({itin: itin})
            // // }


            
        })

        let events = []
        let eventScheduled = []
        console.log(this.state)
        for (let key in this.state.itin.events) {
            if (this.state.itin.events[key].added && !this.state.itin.events[key].schedule){events.push(this.state.itin.events[key])}
            else if (this.state.itin.events[key].schedule){eventScheduled.push(this.state.itin.events[key])}
        }

        // First sorts the array by the date
        eventScheduled.sort((a,b) => {
            return new Date(a.schedule.date) - new Date(b.schedule.date);
          });
        
        // Then sorts it on time
        eventScheduled.sort((a,b) => {
            return new Date(a.schedule.time) - new Date(b.schedule.time);
        });
        let scheduledDates = []
        for (let i = 0; i < eventScheduled.length; i++) {
            if (scheduledDates.indexOf(eventScheduled[i].schedule.date) === -1){scheduledDates.push(eventScheduled[i].schedule.date)}   
        }

        

        
        for (let i in this.state.itin.messages) {
            chatMessages.push(this.state.itin.messages[i])
        }
        console.log('IIITTTIIINNNN ', this.state.itin)
        return (
            <div>
                <div className="single-itin-header">
                    <BurgerMenu />
                    <img className='single-itin-image' src={this.state.itin.imageURL}/>
                    <h1 className="single-itin-title">{this.state.itin.name}</h1>
                </div>

                <MuiThemeProvider>
                <div className="single-itin-status">    
                    {memberArray.map(member => (
                        <List >
                        {member && <ListItem disabled={true}  leftAvatar={<Avatar backgroundColor={blue300} src={member.image} />}>
                            {member.name}: {member.status}
                        </ListItem>}
                        
                        </List>
                    ))}
                </div>
                </MuiThemeProvider>

                <MapComp itinKey = {this.props.match.params}/>
                <h4>Events to be added to timeline: </h4>
                <div class="container">
                    <div class="row">
                        <div className="col-lg-4">
                        {events.map(event => (
                            <div key={event.url}>
                                <h5>{event.title}</h5>
                                <p>People going to this event: </p>
                                {event.likedBy && Object.keys(event.likedBy).map(likeByKey => (
                                    <p key={likeByKey}>{event.likedBy[likeByKey].name}</p>
                                ))}
                                <button onClick={() => {this.renderForm(event)}}>Set Schedule</button>
                            </div>
                        ))}
                        {this.state.showForm.title && 
                            <div>
                                <p>Schedule when to go to {this.state.showForm.title}</p>
                                <MuiThemeProvider>
                                    <DatePicker 
                                    hintText="Select a Date" 
                                    value={this.state.currentDate}
                                    onChange={(nade, data) => this.setState({currentDate: data})}/>
                                    <TimePicker 
                                    hintText="Select a Time" 
                                    value={this.state.currentTime}
                                    onChange={(nada, data) => this.setState({currentTime: data})}/>
                                </MuiThemeProvider>
                                <button onClick={this.submitEvent}>Submit event</button>
                            </div>
                        }
                        </div>
                        <div className="col-lg-8">
                        {scheduledDates.map(date => (
                            <div key={date}>
                            <MuiThemeProvider>
                                
                                <h1>{date}</h1>
                                {eventScheduled.map(event => (
                                    <div key={event.url}>
                                    {event.schedule.date === date && 
                                        <div>
                                        <List>
                                            <ListItem disabled={true} leftAvatar={<Avatar backgroundColor={blue300} />}>
                                                {event.title} @ {event.schedule.time}
                                            </ListItem>
                                        </List>
                                        </div>
                                    }
                                    </div>
                                ))}
                                </MuiThemeProvider>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => this.props.history.push('/ideaboard')}>IdeaBoard</button>
                <button onClick={() => this.setState({showChat: !this.state.showChat})}>Chat</button>
                {this.state.showChat && 
                <div>
                    {chatMessages.map(message => (
                        <p>{message.sender}: {message.content}</p>
                    ))}
                    <form onSubmit={this.sendChat}> 
                        <input name="chatMessage" 
                            type="text" 
                            value={this.state.chatMessage}
                            className="form-control" 
                            placeholder="Send message..."
                            onChange={(e) => {this.setState({chatMessage: e.target.value})}}/>
                        <button type="submit" className="btn btn-primary">Send</button>
                    </form>
                </div>
                }
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    console.log('state', state)
    return {
        itineraryName: state.currentItinerary,
        refresh: state.refresh,
        users: state.users,
        user: state.currentUser

    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setDateAndTime(itinId, event, date, time) {
            dispatch(setDateAndTime(itinId, event, date, time))
        },
        sendMessage(user, itin, message) {
            sendMessage(user, itin, message)
        },
        loadInitialData () {
            dispatch(fetchUsers())
        }
    }
}

const SingleItineraryContainer = connect(mapStateToProps, mapDispatchToProps)(SingleItinerary);
export default SingleItineraryContainer;