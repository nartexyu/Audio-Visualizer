import { useState, useEffect} from 'react'

import { Container, Row, Button, Navbar, Nav, Col, ProgressBar } from 'react-bootstrap'
import SpotifyLogo from './Spotify_Icon_RGB_White.png'

import SpotifyWebApi from 'spotify-web-api-js'

function App() {
  const credentials = {
    AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
    CLIENT_ID: 'a516dbe14c1246f5808d0c5192c0aa6b',
    RESPONSE_TYPE: 'token',
    REDIRECT_URI: 'http://localhost:3000',
    SCOPE: 'user-read-playback-state user-modify-playback-state',
  }  
  
  // Find access token
  const [token, setToken] = useState("")
  useEffect(() => {
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")
    
    if(!token && hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]
      
      window.localStorage.setItem("token", token)
    }
    
    setToken(token)
  }, [])
  
  const logout = () => {
    setToken("")
    window.localStorage.removeItem("token")
  }

  let spotifyApi = new SpotifyWebApi() 
  spotifyApi.setAccessToken(token)

  const [playbackState, setPlaybackState] = useState(false)
  const getPlaybackState = () => {
    spotifyApi
    .getMyCurrentPlaybackState()
    .then(
      function (data) {
        console.log(data)
        setPlaybackState(data)
      },
      (err) => {
        console.error(err);
      }
    )
  }

  let [pause, setPause] = useState(true)
  const startPlayback = () => {
    spotifyApi
    .play()
    .then(
      () => {
        console.log('Starting playback')
        setPause(false)
        getPlaybackState()
      },
      (err) => {
        console.error(err);
      }
    )
  }

  const pausePlayback = () => {
    spotifyApi
    .pause()
    .then(
      () => {
        console.log('Pausing playback')
        setPause(true)
        getPlaybackState()
      },
      (err) => {
        console.error(err);
      }
    )
  }

  const prevSong = () => {
    spotifyApi
    .skipToPrevious()
    .then(
      () => {
        console.log('Skipping to previous song')
        getPlaybackState()
        setPause(false)
      },
      (err) => {
        console.error(err);
      }
    )
  }

  const nextSong = () => {
    spotifyApi
    .skipToNext()
    .then(
      () => {
        console.log('Skipping to next song')
        getPlaybackState()
        setPause(false)
      },
      (err) => {
        console.error(err);
      }
    )
  }

  const millisToMinutesAndSeconds = (millis) => {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }

  const style = {
    container: {
      height: '100vh', 
      width: '100vw'
    },
    loginButton: {
      width: '1.5rem', 
      height: '1.5rem', 
      marginLeft: '0.25rem'
    },
    githubSvgPath: 
      'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
    header: {
      background: 'rgba(20,20,20,0.1)', 
      zIndex: '2'
    },
    logoutButton: {
      background: '#1DB954', 
      opacity: '0.75'
    },
    jumbotron: {
      height:'100vh', 
      zIndex: '1', 
      background:'rgba(211,211,211,0.1'
    },
    footer: {
      background: 'rgba(20,20,20,0.1)', 
      height: '12vh', 
      zIndex: '2'
    },
    playSvgPath: 
      'M23 12l-22 12v-24l22 12zm-21 10.315l18.912-10.315-18.912-10.315v20.63z'
    ,
    pauseSvgPath: 
      'M10 24h-6v-24h6v24zm10 0h-6v-24h6v24zm-11-23h-4v22h4v-22zm10 0h-4v22h4v-22z'
    ,
    prevSvgPath: 
      'M22 24l-18-12 18-12v24zm-19-24v24h-1v-24h1zm2.803 12l15.197 10.132v-20.263l-15.197 10.131z'
    ,
    nextSvgPath: 
      'M2 24l18-12-18-12v24zm19-24v24h1v-24h-1zm-2.803 12l-15.197 10.132v-20.263l15.197 10.131z'
  }

  return (
    <div> 
      {!token ?
        <Container fluid className='d-flex align-items-center justify-content-center' style={style.container}>
          <Row> 
              <h1 className='text-center'>Audio Visualizer</h1>
              <div className='text-center'>
                <Button variant='dark' href=
                {`
                ${credentials.AUTH_ENDPOINT}?client_id=${credentials.CLIENT_ID}&response_type=${credentials.RESPONSE_TYPE}&scope=${credentials.SCOPE}&redirect_uri=${credentials.REDIRECT_URI}`
                } 
                size='lg' className = 'rounded-pill me-3' style={{background: '#1DB954'}}>
                  Login <img src={SpotifyLogo} style={style.loginButton} />
                </Button>
                <Button href='https://github.com/nartexyu/Audio-Visualizer' variant='link' target='_blank'>
                  <svg  width='1.5rem' height='1.5rem'><path d={style.githubSvgPath}/></svg>
                </Button>
              </div>
          </Row> 
        </Container> 
        : 
        <div> 
          {/* Header */}
          <Navbar expand='lg' className='fixed-top m-auto' style={style.header}>
            <Container>
              <Navbar.Brand>Audio Visualizer</Navbar.Brand>
              <Navbar.Toggle aria-controls='basic-navbar-nav'/>
              <Navbar.Collapse id='basic-navbar-nav' className='justify-content-end'>
                <Nav className='me-auto'>
                  <Nav.Link href='https://github.com/nartexyu/Audio-Visualizer' target={'_blank'}> Github </Nav.Link>
                </Nav>
                <Button variant='dark' onClick={logout} size='md' className = 'rounded-pill' style={style.logoutButton}>
                    Logout
                </Button>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          
          {/* Center */}
          <Container fluid className='d-flex align-items-center justify-content-center' style={style.jumbotron}>
            <Button onClick={getPlaybackState}>Get Currently Playing</Button>
          </Container>

          {/* Footer */}
          <Navbar expand='lg' className='fixed-bottom p-0' style={style.footer}>
            <Col>
                <Row className='d-flex align-items-end'>
                  <Col md={3} className='text-center'>
                    <img src={playbackState ? playbackState.item.album.images[1].url : 'https://via.placeholder.com/96'} style={{height:'96px'}}></img>
                  </Col>
                  <Col className='p-0'>
                    <Row>
                      <h4 className='mb-0'>{playbackState ? playbackState.item.name : `Song Name`}</h4>
                    </Row>
                    <Row>
                      <h5 className='mb-0'>{playbackState ? playbackState.item.artists[0].name : `Artist`}</h5>
                    </Row>
                  </Col>
                </Row>
            </Col>
            
            <Col>
              <Row className='d-flex justify-content-center text-center p-3'>
                <Col md={4}>
                  <Button variant="link">
                    <svg width='1.5rem' height='1.5rem' className='d-block' onClick={prevSong}><path d={style.prevSvgPath}/></svg>
                  </Button>
                </Col>
                <Col md={4}>
                  {pause ? 
                    <Button variant="link" className='m' onClick={startPlayback}>
                      <svg width='1.5rem' height='1.5rem' className='d-block ms-1'><path d={style.playSvgPath}/></svg>
                    </Button> :
                    <Button variant="link" className='m' onClick={pausePlayback}>
                    <svg width='1.5rem' height='1.5rem' className='d-block ms-1'><path d={style.pauseSvgPath}/></svg>
                    </Button>
                  }
                </Col>
                <Col md={4}>
                  <Button variant="link">
                    <svg width='1.5rem' height='1.5rem' className='d-block' onClick={nextSong}><path d={style.nextSvgPath}/></svg>
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col md={1}>
                  <h6>{playbackState ? millisToMinutesAndSeconds(playbackState.progress_ms) : `00:00`}</h6>
                </Col>
                <Col md={10}>
                  <ProgressBar now={playbackState ? playbackState.progress_ms / playbackState.item.duration_ms * 100 : 0}/>
                </Col>
                <Col md={1}>
                  <h6>{playbackState ? millisToMinutesAndSeconds(playbackState.item.duration_ms) : `00:00`}</h6>
                </Col>
              </Row>
            </Col>
            
            <Col>
            </Col>
          </Navbar>
        </div>
      }
    </div>
  );
}

export default App;
