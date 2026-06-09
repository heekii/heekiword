class AudioManager {
  constructor() {
    this.audioContext = null
    this.isEnabled = true
    this.isMuted = false
    this.initAudioContext()
    this.detectDeviceState()
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
    } catch (e) {
      console.log('Web Audio API not supported')
    }
  }

  detectDeviceState() {
    if ('mediaDevices' in navigator) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const hasAudioOutput = devices.some(device => device.kind === 'audiooutput')
        this.isMuted = !hasAudioOutput
      })
    }

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'microphone' }).then(result => {
        if (result.state === 'prompt' || result.state === 'denied') {
          this.isMuted = true
        }
      })
    }
  }

  play(type) {
    if (!this.isEnabled || !this.audioContext || this.isMuted) return

    try {
      const now = this.audioContext.currentTime
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      switch (type) {
        case 'success':
          this.playSuccess(oscillator, gainNode, now)
          break
        case 'error':
          this.playError(oscillator, gainNode, now)
          break
        case 'click':
          this.playClick(oscillator, gainNode, now)
          break
        case 'warning':
          this.playWarning(oscillator, gainNode, now)
          break
      }
    } catch (e) {
      console.log('Audio playback error:', e)
    }
  }

  playSuccess(oscillator, gainNode, now) {
    oscillator.frequency.setValueAtTime(400, now)
    oscillator.frequency.setValueAtTime(600, now + 0.1)
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.setValueAtTime(0, now + 0.2)
    oscillator.start(now)
    oscillator.stop(now + 0.2)
  }

  playError(oscillator, gainNode, now) {
    oscillator.frequency.setValueAtTime(200, now)
    oscillator.frequency.setValueAtTime(100, now + 0.1)
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.setValueAtTime(0, now + 0.2)
    oscillator.start(now)
    oscillator.stop(now + 0.2)
  }

  playClick(oscillator, gainNode, now) {
    oscillator.frequency.setValueAtTime(800, now)
    gainNode.gain.setValueAtTime(0.1, now)
    gainNode.gain.setValueAtTime(0, now + 0.05)
    oscillator.start(now)
    oscillator.stop(now + 0.05)
  }

  playWarning(oscillator, gainNode, now) {
    oscillator.frequency.setValueAtTime(300, now)
    oscillator.frequency.setValueAtTime(400, now + 0.05)
    gainNode.gain.setValueAtTime(0.2, now)
    gainNode.gain.setValueAtTime(0, now + 0.1)
    oscillator.start(now)
    oscillator.stop(now + 0.1)
  }

  disable() {
    this.isEnabled = false
  }

  enable() {
    this.isEnabled = true
  }
}

export default new AudioManager()
