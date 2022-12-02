import { useState, useEffect } from 'react'

import { Container, Row, Button, Navbar, Nav, Col } from 'react-bootstrap'
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

  const [currentlyPlaying, setCurrentlyPlaying] = useState("")
  const getCurrentlyPlaying = async (e) => {
    e.preventDefault()
    spotifyApi
    .getMyCurrentPlayingTrack() // note that we don't pass a user id
    .then(
      function (data) {
        console.log('Currently Playing:', data)
        setCurrentlyPlaying(data)
      },
      function (err) {
        console.error(err);
      }
    )

  }

let spotifyApi = new SpotifyWebApi() 
spotifyApi.setAccessToken(token)



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
    svgPath: 
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
    }
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
                  <svg  width='1.5rem' height='1.5rem'><path d={style.svgPath}/></svg>
                </Button>
              </div>
          </Row> 
        </Container> 
      : 
        <div> 
          {/* Header */}
          <Navbar  expand='lg' className='fixed-top m-auto' style={style.header}>
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
            <Button onClick={getCurrentlyPlaying}>Get Currently Playing</Button>
          </Container>

          {/* Footer */}
          <Navbar expand='lg' className='fixed-bottom d-flex' style={style.footer}>
            <Row>
                <Col>{currentlyPlaying.name}</Col>
                <Col className='justify-content-center'></Col>
                <Col></Col>
            </Row>
          </Navbar>
        </div>
      }
    </div>
  );
}

export default App;
