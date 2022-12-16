import { useState, useEffect, useRef } from 'react'
import { Container, Row, Button, Navbar, Nav, Col, ProgressBar } from 'react-bootstrap'
import { Canvas, useFrame } from '@react-three/fiber'
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

  // Spotify API
  let spotifyApi = new SpotifyWebApi() 
  spotifyApi.setAccessToken(token)

  // Spotify API States
  const [playbackState, setPlaybackState] = useState(false)
  const [playTime, setPlayTime] = useState("")
  const [features, setFeatures] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [segmentData, setSegmentData] = useState("")
  const [segmentIndex, setSegmentIndex] = useState("")
  const [pause, setPause] = useState(true)

  // Gets playback state of active spotify session and sets response to playbackState. Then gets audio features and audio analysis
  const getPlaybackState = () => {
    spotifyApi
    .getMyCurrentPlaybackState()
    .then((res) => {
      // console.log(res)
      spotifyApi.getAudioFeaturesForTrack(res.item.id)
      .then((features) => {
        // console.log(features)
        setFeatures(
          {
            acousticness: features.acousticness,
            danceability: features.danceability,
            energy: features.energy,
            instrumentalness: features.instrumentalness,
            liveness: features.liveness,
            loudness: features.loudness,
            speechiness: features.speechiness,
            tempo: features.tempo,
            timeSignature: features.time_signature,
            valence: features.valence
          }
        )
      })
      spotifyApi.getAudioAnalysisForTrack(res.item.id)
      .then((analysis) => {
        // console.log(analysis)
        setAnalysis(
          {
            key: analysis.track.key,
            keyConf: analysis.track.key_confidence,
            mode: analysis.track.mode,
            segments: analysis.segments,
            sections: analysis.sections
          }
        )
        let bSearchSegment = bSearch(analysis.segments, res.progress_ms / 1000)
        setSegmentIndex(bSearchSegment)
        setSegmentData(analysis.segments[bSearchSegment])
      })
      setPlaybackState(
        {
          name: res.item.name,
          artist: res.item.artists[0].name,
          img: res.item.album.images[1].url
        }
      )
      setPlayTime(
        {
          progress: res.progress_ms,
          duration: res.item.duration_ms,
          isPlaying: res.is_playing
        }
      )
    },
      (err) => {
        console.error(err)
      }
    )
  }

  // Gets current progress time
  const getTimeStamp = () => {
    spotifyApi
    .getMyCurrentPlaybackState()
    .then((res) => {
      // console.log(res)
      setPlayTime(
        {
          progress: res.progress_ms,
          duration: res.item.duration_ms,
          isPlaying: res.is_playing
        }
      )
      setPlaybackState(
        {
          name: res.item.name,
          artist: res.item.artists[0].name,
          img: res.item.album.images[1].url
        }
      )
      },
      (err) => {
        console.error(err)
      }
    )
  }

  // Starts playback of active spotify session
  const startPlayback = () => {
    spotifyApi.play()
      .then(() => {
        console.log('Starting playback')
        getPlaybackState()
        getTimeStamp()
        setPause(false)
      }, (err) => {
        console.error(err)
      }
    )
  }

  // Pauses playback of active spotify session
  const pausePlayback = () => {
    spotifyApi
    .pause()
    .then(
      () => {
        console.log('Pausing playback')
        getPlaybackState()
        getTimeStamp()
        setPause(true)
      },
      (err) => {
        console.error(err)
      }
    )
  }
  
  // Skips to previous song 
  const prevSong = () => {
    spotifyApi
    .skipToPrevious()
    .then(
      () => {
        console.log('Skipping to previous song')
        setSegmentData()
        getPlaybackState()
        setPause(false)
      },
      (err) => {
        console.error(err)
      }
      )
    }

  // Skips to next song 
  const nextSong = () => {
    spotifyApi
    .skipToNext()
    .then(
      () => {
        console.log('Skipping to next song')
        setSegmentData()
        getPlaybackState()
        setPause(false)
      },
      (err) => {
        console.error(err)
      }
    )
  }

  const refreshStates = () => {
    setSegmentData()
    getPlaybackState()
  }
  
  // If session not paused, every 1000ms, add 1 second to the playback time. useEffect triggered by pause state
  useEffect(() => {
    let interval = null
    if (!pause) {
      interval = setInterval(() => {
        getTimeStamp()
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => {
      clearInterval(interval)
    }
  }, [pause])
  
  useEffect(() => {
    let interval = null
    if (!pause && segmentIndex) {
      let i = segmentIndex
      let segmentDelay = analysis.segments[i].duration * 1000
      if (i < analysis.segments.length){
        const loopSegments = () => {
          interval = setTimeout(() => {
            i++
            segmentDelay = analysis.segments[i+1].duration * 1000
            setSegmentData(analysis.segments[i+1])
            console.log(analysis.segments[i+1].loudness_max)
            loopSegments()
          }, segmentDelay)
        }
        loopSegments()
      }
    } else {
      clearInterval(interval)
    }
    return () => {
      clearInterval(interval)
    }
  }, [pause])


  // Binary search array of segments to find out which current segment we are in
  const bSearch = (arr, x) => {
    let start = 0, end = arr.length - 1
    while (start <= end){
      let mid = Math.floor((start + end) / 2)
      if (arr[mid].start === x) return start
      else if (arr[mid].start < x)
        start = mid + 1
      else
        end = mid - 1
    }
    return start
  }

  // Converts song time in ms to minutes and seconds (XX:XX) format 
  const millisToMinutesAndSeconds = (millis) => {
    let minutes = Math.floor(millis / 60000)
    let seconds = ((millis % 60000) / 1000).toFixed(0)
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds
  }

  // Styling object
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
    spotifyColor: {
      background: '#1DB954'
    },
    jumbotron: {
      height:'100vh',
      width: '100vw', 
      zIndex: '1', 
      background:'rgba(211,211,211,0.1',
      padding: '0'
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
    ,
    refreshSvgPath:
      'M7 9h-7v-7h1v5.2c1.853-4.237 6.083-7.2 11-7.2 6.623 0 12 5.377 12 12s-5.377 12-12 12c-6.286 0-11.45-4.844-11.959-11h1.004c.506 5.603 5.221 10 10.955 10 6.071 0 11-4.929 11-11s-4.929-11-11-11c-4.66 0-8.647 2.904-10.249 7h5.249v1z'
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
                size='lg' className = 'rounded-pill me-3' style={style.spotifyColor}>
                  Login <img alt={"Spotify Logo"} src={SpotifyLogo} style={style.loginButton} />
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

          <Container fluid className='d-flex align-items-center justify-content-center text-center' style={style.jumbotron}>
            <Canvas style={{height: '100vh', width: '100vw'}}>
              <color attach="background" args={[analysis? `hsl(${Math.floor(analysis.key * 30)}, ${analysis.keyConf * 100}%, 95%)` : 'white']} />
              <ambientLight intensity={1}/>
              <pointLight position={[10,10,10]} />
              <Box 
                position={[0,0,0]} 
                segmentData={segmentData} 
                tempo={features ? features.tempo : 100}
                color={features}
              />
            </Canvas>
          </Container>

          {/* Footer */}
          <Navbar expand='lg' className='fixed-bottom p-0' style={style.footer}>
            <Col>
                <Row className='d-flex align-items-end'>
                  <Col md={3} className='text-center'>
                    <img src={playbackState ? playbackState.img : 'https://via.placeholder.com/96'} alt={":)"} style={{height:'96px'}}></img>
                  </Col>
                  <Col className='p-0'>
                    <Row>
                      <h4 className='mb-0'>{playbackState ? playbackState.name : `Song Name`}</h4>
                    </Row>
                    <Row>
                      <h5 className='mb-0'>{playbackState ? playbackState.artist : `Artist`}</h5>
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
                  <h6>{playTime ? millisToMinutesAndSeconds(playTime.progress) : `00:00`}</h6>
                </Col>
                <Col md={10}>
                  <ProgressBar variant="light" now={playTime ? playTime.progress / playTime.duration * 100 : 0}/>
                </Col>
                <Col md={1}>
                  <h6>{playTime ? millisToMinutesAndSeconds(playTime.duration) : `00:00`}</h6>
                </Col>
              </Row>
            </Col>
            
            <Col className='d-flex justify-content-end'>
              <Button variant="link" className='me-3'>
              <svg width='1.5rem' height='1.5rem' className='d-block' onClick={refreshStates}><path d={style.refreshSvgPath}/></svg>
              </Button>
            </Col>
          </Navbar>
        </div>
      }
    </div>
  )
}

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.y += Math.PI / 180 / 3 * (props.tempo / 100) ))
  // Return the view, these are regular Threejs elements expressed in JSX

  let coord1 = 1, coord2 = 1, coord3 = 1, coord4 = 1, coord5 = 1, coord6 = 1, coord7 = 1, coord8 = 1, coord9 = 1, coord10 = 1, coord11 = 1, coord12 = 1 

  if (props.segmentData) { 
    coord1 = props.segmentData.pitches[0]
    coord2 = props.segmentData.pitches[1]
    coord3 = props.segmentData.pitches[2]
    coord4 = props.segmentData.pitches[3]
    coord5 = props.segmentData.pitches[4]
    coord6 = props.segmentData.pitches[5]
    coord7 = props.segmentData.pitches[6]
    coord8 = props.segmentData.pitches[7]
    coord9 = props.segmentData.pitches[8]
    coord10 = props.segmentData.pitches[9]
    coord11 = props.segmentData.pitches[10] 
    coord12 = props.segmentData.pitches[11]
  }

  const t = 1.618
  const positions = new Float32Array([
    -1*coord1,t*coord1,0,   1*coord2,t*coord2,0,    -1*coord3,-t*coord3,0,    1*coord4,-t*coord4,0,
    0,-1*coord5,t*coord5,   0,1*coord6,t*coord6,    0,-1*coord7,-t*coord7,    0,1*coord8,-t*coord8,
    t*coord9,0,-1*coord9,   t*coord10,0,1*coord10,    -t*coord11,0,-1*coord11,    -t*coord12,0,1*coord12
  ])

  const indices = new Uint16Array([
    0,11,5,   0,5,1,    0,1,7,    0,7,10,   0,10,11,
    1,5,9,    5,11,4,   11,10,2,  10,7,6,   7,1,8,
    3,9,4,    3,4,2,    3,2,6,    3,6,8,    3,8,9,
    4,9,5,    2,4,11,   6,2,10,   8,6,7,    9,8,1
  ])

  let posRef = useRef()

  useFrame(() => {
    posRef.current.needsUpdate = true
  })

  let color = 'black'
  if (props.color) {
    color = `hsl(${Math.floor(props.color.danceability * 360)}, ${Math.floor(props.color.energy * 100)}%, ${Math.floor(props.color.valence * 100)}%)`
  }
  // console.log(color)

  return (
    <mesh
      {...props}
      ref={ref}
    >
        
      {/* <polyhedronGeometry args={[positions, indices]} /> */}
      <bufferGeometry>
            <bufferAttribute
                attach='attributes-position'
                array={positions}
                count={positions.length / 3}
                itemSize={3}
                ref={posRef}
            />
            <bufferAttribute
                attach="index"
                array={indices}
                count={indices.length}
            />
        </bufferGeometry>
      <meshBasicMaterial wireframe={true} color={color}/>
    </mesh>
  )
}


export default App
