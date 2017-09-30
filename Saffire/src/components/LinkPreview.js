// import React, {Component} from 'react';
// import {connect} from 'react-redux';
// //import Navbar from './navbar';
// //import { postIdea } from '../actions';


// const LinkPreview = (props) => {
    
//     return (
//         <h1>LinkPreview component here</h1>
//     )
// }

// const mapStateToProps = (state) => {
//     return {
//         itineraryName: state.currentItinerary
//     }
// }

// const mapDispatchToProps = (dispatch) => {
//     return {
        
//     }
// }

// const LinkPreviewContainer = connect(mapStateToProps, mapDispatchToProps)(LinkPreview);
// export default LinkPreviewContainer;

import React, {Component} from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import {connect} from 'react-redux';
import {newLike} from '../actions'

class LinkPreview extends Component {
  constructor(props) {
    super(props)
  }


  render () {
    return(
      <Card expanded={false}>
        <CardMedia
          overlay={<CardTitle title={this.props.title} />}
          mediaStyle={{width: 300, height: 300}}
          style={{width: 300}}
        >
          <img src={this.props.image} alt="" />
        </CardMedia>
        <CardActions>
          <FlatButton label={`Like ${this.props.likes}`} onClick={() => this.props.newLike(this.props.eventKey, this.props.itinKey)}/>
          <FlatButton label="Add To Itinerary" />
        </CardActions>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return {

  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    newLike(eventId, itinKey) {
      dispatch(newLike(eventId, itinKey))
    }
  }
}

const LinkPreviewContainer = connect(mapStateToProps, mapDispatchToProps)(LinkPreview);
export default LinkPreviewContainer;