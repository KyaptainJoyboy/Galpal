// WebRTC Service for GalPal Medical App
class WebRTCService {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isCallActive = false;
        this.isMuted = false;
        this.isVideoOn = true;
        
        // STUN servers for NAT traversal
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.mediaConstraints = {
            video: true,
            audio: true
        };
    }

    async initializeCall() {
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('Camera not available, starting demo mode');
                this.startDemoCall();
                return true;
            }

            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);

            // Create peer connection
            this.peerConnection = new RTCPeerConnection(this.configuration);

            // Add local stream to peer connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Set up event handlers
            this.setupPeerConnectionHandlers();

            // Display local video
            this.displayLocalVideo();

            this.isCallActive = true;

            // Notify app about successful initialization
            if (typeof window.app !== 'undefined') {
                window.app.showToast('Video Call Ready', 'Camera and microphone initialized successfully', 'success');
            }

            return true;

        } catch (error) {
            console.error('Failed to initialize call:', error);
            // Fall back to demo mode if camera access fails
            console.log('Camera access denied, starting demo mode');
            this.startDemoCall();
            return true;
        }
    }

    setupPeerConnectionHandlers() {
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // In a real implementation, send candidate to remote peer
                console.log('ICE candidate:', event.candidate);
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            this.displayRemoteVideo();
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            this.updateConnectionStatus();
        };

        // Handle ICE connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        };
    }

    displayLocalVideo() {
        const container = document.getElementById('videoCallContainer');
        if (!container) return;

        // Create local video element
        let localVideo = document.getElementById('localVideo');
        if (!localVideo) {
            localVideo = document.createElement('video');
            localVideo.id = 'localVideo';
            localVideo.autoplay = true;
            localVideo.muted = true; // Always mute local video to prevent feedback
            localVideo.playsInline = true;
            localVideo.style.cssText = `
                width: 200px;
                height: 150px;
                position: absolute;
                top: 10px;
                right: 10px;
                border: 2px solid #6A4C93;
                border-radius: 8px;
                background: #000;
                z-index: 10;
            `;
            container.appendChild(localVideo);
        }

        localVideo.srcObject = this.localStream;
    }

    displayRemoteVideo() {
        const container = document.getElementById('videoCallContainer');
        if (!container) return;

        // Create remote video element
        let remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo) {
            remoteVideo = document.createElement('video');
            remoteVideo.id = 'remoteVideo';
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.style.cssText = `
                width: 100%;
                height: 100%;
                background: #000;
                object-fit: cover;
            `;
            container.appendChild(remoteVideo);
        }

        remoteVideo.srcObject = this.remoteStream;
    }

    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw error;
        }
    }

    async createAnswer(offer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Failed to create answer:', error);
            throw error;
        }
    }

    async handleAnswer(answer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Failed to handle answer:', error);
            throw error;
        }
    }

    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
            throw error;
        }
    }

    toggleMute() {
        if (!this.localStream) return false;

        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        this.isMuted = !this.isMuted;
        this.updateMuteButton();
        
        return this.isMuted;
    }

    toggleVideo() {
        if (!this.localStream) return false;

        const videoTracks = this.localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        this.isVideoOn = !this.isVideoOn;
        this.updateVideoButton();
        
        return this.isVideoOn;
    }

    updateMuteButton() {
        const muteBtn = document.getElementById('toggleMute');
        if (muteBtn) {
            const icon = muteBtn.querySelector('i');
            if (this.isMuted) {
                icon.className = 'bi bi-mic-mute me-2';
                muteBtn.classList.add('btn-danger');
                muteBtn.classList.remove('btn-secondary');
                muteBtn.innerHTML = '<i class="bi bi-mic-mute me-2"></i>Unmute';
            } else {
                icon.className = 'bi bi-mic me-2';
                muteBtn.classList.add('btn-secondary');
                muteBtn.classList.remove('btn-danger');
                muteBtn.innerHTML = '<i class="bi bi-mic me-2"></i>Mute';
            }
        }
    }

    updateVideoButton() {
        const videoBtn = document.getElementById('toggleVideo');
        if (videoBtn) {
            if (this.isVideoOn) {
                videoBtn.innerHTML = '<i class="bi bi-camera-video me-2"></i>Video';
                videoBtn.classList.add('btn-secondary');
                videoBtn.classList.remove('btn-danger');
            } else {
                videoBtn.innerHTML = '<i class="bi bi-camera-video-off me-2"></i>Video Off';
                videoBtn.classList.add('btn-danger');
                videoBtn.classList.remove('btn-secondary');
            }
        }
    }

    updateConnectionStatus() {
        if (!this.peerConnection) return;

        const status = this.peerConnection.connectionState;
        const container = document.getElementById('videoCallContainer');
        
        if (!container) return;

        // Remove existing status indicator
        const existingStatus = container.querySelector('.connection-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Add new status indicator
        const statusElement = document.createElement('div');
        statusElement.className = 'connection-status';
        statusElement.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            z-index: 10;
        `;

        switch (status) {
            case 'connecting':
                statusElement.style.background = '#ffc107';
                statusElement.textContent = '🔄 Connecting...';
                break;
            case 'connected':
                statusElement.style.background = '#28a745';
                statusElement.textContent = '🟢 Connected';
                break;
            case 'disconnected':
                statusElement.style.background = '#dc3545';
                statusElement.textContent = '🔴 Disconnected';
                break;
            case 'failed':
                statusElement.style.background = '#dc3545';
                statusElement.textContent = '❌ Connection Failed';
                break;
            default:
                statusElement.style.background = '#6c757d';
                statusElement.textContent = '⚪ ' + status;
        }

        container.appendChild(statusElement);
    }

    endCall() {
        try {
            // Stop all media tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.localStream = null;
            }

            // Close peer connection
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            // Clean up video elements
            const container = document.getElementById('videoCallContainer');
            if (container) {
                container.innerHTML = `
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <div class="text-center">
                            <i class="bi bi-camera-video-off text-muted" style="font-size: 3rem;"></i>
                            <p class="text-muted mt-3">Call Ended</p>
                        </div>
                    </div>
                `;
            }

            this.isCallActive = false;
            this.isMuted = false;
            this.isVideoOn = true;

            // Notify app
            if (typeof window.app !== 'undefined') {
                window.app.showToast('Call Ended', 'Video call has been terminated', 'info');
            }

        } catch (error) {
            console.error('Error ending call:', error);
        }
    }

    // Utility methods for checking WebRTC support
    static isSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.RTCPeerConnection);
    }

    static async checkPermissions() {
        try {
            const permissions = await Promise.all([
                navigator.permissions.query({name: 'camera'}),
                navigator.permissions.query({name: 'microphone'})
            ]);
            
            return {
                camera: permissions[0].state,
                microphone: permissions[1].state
            };
        } catch (error) {
            console.warn('Cannot check permissions:', error);
            return { camera: 'unknown', microphone: 'unknown' };
        }
    }

    // Screen sharing capability
    async shareScreen() {
        if (!navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen sharing not supported');
        }

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Replace video track
            if (this.peerConnection && this.localStream) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            return screenStream;
        } catch (error) {
            console.error('Screen sharing failed:', error);
            throw error;
        }
    }

    // File sharing through data channel
    setupDataChannel() {
        if (!this.peerConnection) return null;

        const dataChannel = this.peerConnection.createDataChannel('fileShare', {
            ordered: true
        });

        dataChannel.onopen = () => {
            console.log('Data channel opened');
        };

        dataChannel.onmessage = (event) => {
            console.log('Data channel message:', event.data);
            this.handleFileShare(event.data);
        };

        return dataChannel;
    }

    handleFileShare(data) {
        try {
            const fileInfo = JSON.parse(data);
            
            if (typeof window.app !== 'undefined') {
                window.app.showToast(
                    'File Received', 
                    `${fileInfo.name} (${fileInfo.size} bytes)`, 
                    'info'
                );
            }
        } catch (error) {
            console.error('File share handling error:', error);
        }
    }

    // Mock connection for demo purposes
    startDemoCall() {
        const container = document.getElementById('videoCallContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="position-relative h-100 bg-dark d-flex align-items-center justify-content-center">
                <div class="text-center text-white">
                    <i class="bi bi-person-video3 text-primary" style="font-size: 5rem;"></i>
                    <h5 class="mt-3">Demo Video Call</h5>
                    <p class="text-muted">In a real deployment, this would connect to a healthcare provider</p>
                    <div class="mt-4">
                        <span class="badge bg-success">🟢 Demo Mode Active</span>
                    </div>
                </div>
                
                <div class="position-absolute bottom-0 start-0 p-3">
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-secondary" onclick="WebRTCService.sendDemoMessage()">
                            <i class="bi bi-chat-dots"></i> Chat
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="WebRTCService.shareDemoFile()">
                            <i class="bi bi-paperclip"></i> Share File
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.isCallActive = true;
        
        if (typeof window.app !== 'undefined') {
            window.app.showToast('Demo Call Started', 'This is a demonstration of video call features', 'info');
        }
    }

    static sendDemoMessage() {
        if (typeof window.app !== 'undefined') {
            window.app.showToast('Chat Message', 'Demo: "Hello, how can I help you today?"', 'info');
        }
    }

    static shareDemoFile() {
        if (typeof window.app !== 'undefined') {
            window.app.showToast('File Shared', 'Demo: Medical report shared with healthcare provider', 'success');
        }
    }
}

// Create global instance
const webRTCService = new WebRTCService();
window.webRTCService = webRTCService;

// Set up WebRTC event handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for WebRTC modal buttons
    document.addEventListener('click', (e) => {
        if (e.target.id === 'endCall') {
            webRTCService.endCall();
            const modal = bootstrap.Modal.getInstance(document.getElementById('videoCallModal'));
            if (modal) modal.hide();
        } else if (e.target.id === 'toggleMute') {
            webRTCService.toggleMute();
        } else if (e.target.id === 'toggleVideo') {
            webRTCService.toggleVideo();
        }
    });
});