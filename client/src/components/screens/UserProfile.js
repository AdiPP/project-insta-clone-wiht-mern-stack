import React, {useEffect, useState, useContext} from 'react';
import {UserContext} from '../../App';
import {useParams} from 'react-router-dom'

const UserProfile = () => {
  const [userProfile, setProfile] = useState(null)
  const {state, dispatch} = useContext(UserContext)
  const {userid} = useParams()
  const [showFollow, setShowFollow] = useState(state ? !state.following.includes(userid):true)
  useEffect(() => {
    fetch(`/user/${userid}`, {
      headers: {
        "Authorization":localStorage.getItem("jwt")
      }
    }).then(res => res.json())
    .then(result => {
      // console.log(result)
      setProfile(result)
    })
  }, [])

  const followUser = () => {
    fetch('/follow', {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("jwt")
      },
      body: JSON.stringify({
        followId:userid
      })
    })
    .then(res => res.json())
    .then(data => {
      dispatch({type:"UPDATE", payload: {
        following: data.following,
        followers: data.followers
      }})
      localStorage.setItem("user", JSON.stringify(data))
      setProfile((prevState) => {
        return {
          ...prevState,
          user:{
            ...prevState.user,
            followers:[...prevState.user.followers, data._id]
          }
        }
      })
      setShowFollow(false)
    })
  }

  const unfollowUser = () => {
    fetch('/unfollow', {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("jwt")
      },
      body: JSON.stringify({
        unfollowId:userid
      })
    })
    .then(res => res.json())
    .then(data => {
      dispatch({type:"UPDATE", payload: {
        following: data.following,
        followers: data.followers
      }})
      localStorage.setItem("user", JSON.stringify(data))
      setProfile((prevState) => {
        const newFollower = prevState.user.followers.filter(item => item !== data._id)
        return {
          ...prevState,
          user:{
            ...prevState.user,
            followers:newFollower
          }
        }
      })
      setShowFollow(true)
    })
  }

  return (
    <div style={{
      maxWidth:"550px",
      margin:"0 auto"
    }}>
      <div style={{
          display:"flex",
          justifyContent:"space-around",
          margin:"18px 0px",
          borderBottom:"1px solid grey"
      }}>
        <div>
          <img
            style={{width: "160px", height: "160px", borderRadius:"80px"}}
            src={userProfile ? userProfile.user.pic : 'Loading...'}
          />
        </div>
        <div>
          <h4>{userProfile ? userProfile.user.name : 'Loading...'}</h4>
          <h5>{userProfile ? userProfile.user.email : 'Loading...'}</h5>
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            width:"108%"
          }}>
            <h6>
              {userProfile ? userProfile.posts.length : 'Loading...'} posts
            </h6>
            <h6>
              {userProfile ? userProfile.user.followers.length : 'Loading...'} followers
            </h6>
            <h6>
              {userProfile ? userProfile.user.following.length : 'Loading...'} following
            </h6>
          </div>
          {
            showFollow ?
            <button 
              style={{
                margin: "10px"
              }}
              className="btn waves-effect waves-light #64b5f6 blue darken-2"
              onClick={() => followUser()}
            >
              Follow
            </button>
            :
            <button
              style={{
                margin: "10px"
              }}
              className="btn waves-effect waves-light #64b5f6 blue darken-2"
              onClick={() => unfollowUser()}
            >
              Unfollow
            </button>
          }
        </div>
      </div>
    
      <div className="gallery">
        {
          userProfile
          ?
          userProfile.posts.map(item => {
            return (
              <img 
                key={item._id}
                className="item"
                src={item.photo}
              /> 
            )
          })
          :
          null
        }
      </div>
    </div>
  )
}

export default UserProfile;