import React from 'react'
import {connect} from 'react-redux'
import { withRouter } from 'react-router-dom'
import firebase from '../firebase'
import BurgerMenu from './Menu';

/**
 * COMPONENT
 *  The Main component is our 'picture frame' - it displays the navbar and anything
 *  else common to our entire app. The 'picture' inside the frame is the space
 *  rendered out by the component's `children`.
 */
export class UserLogin extends React.Component {
  constructor () {
    
    super()
    this.state = {
      email: '',
      password: ''
    }
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  render () { 
    return (
      <div className= "sapphire-user-signup-div">
         <BurgerMenu />
        
         <h1>SAFFIRE</h1>


        <div className = "sapphire-user-signup-box">
          <form className = "sapphire-user-signup-form" onSubmit={this.handleSubmit}>

            <h2>USER LOGIN</h2>

            <div className = "sapphire-user-signup-input">
              <input type='text' placeholder="Email" onChange={(e) => this.setState({email: e.target.value})}/>
            </div>

              <div className="sapphire-user-signup-input">
                <input placeholder="Password" type='password' onChange={(e) => this.setState({password: e.target.value})}/>
              </div>

              <div className = "sapphire-user-signup-button-div">
                <button type='submit' className="btn btn-primary" >SEND</button>
              </div>
          </form>
        </div>

      </div>

    )
  }

  handleSubmit (e) {
    e.preventDefault()
    firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).catch(function (error) {
      console.log(error.code)
      console.log(error.message)
    }).then(() => this.props.history.push('/'))
    
  }

  
}

// The `withRouter` wrapper makes sure that updates are not blocked
// when the url changes
export default withRouter(connect()(UserLogin))
