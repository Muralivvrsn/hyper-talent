import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import axios from 'axios';

const SlackConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const chrome = window.chrome;

  useEffect(() => {
    // Check if already connected
    chrome.storage.local.get(['slackTokens'], (result) => {
      if (result.slackTokens) {
        console.log('Stored tokens found');
        setIsConnected(true);
      }
    });
  }, []);

  const sendMessage = async () => {
    if (!message) return;

    try {
      const tokens = await chrome.storage.local.get(['slackTokens']);
      console.log('Sending message to channel:', process.env.REACT_APP_CHANNEL_ID);

      const response = await axios({
        method: 'post',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
          'Authorization': `Bearer ${tokens.slackTokens.access_token}`,
          'Content-Type': 'application/json',
        },
        data: {
          channel: process.env.REACT_APP_CHANNEL_ID,
          text: message,
        }
      });

      console.log('Message send response:', response.data);

      if (response.data.ok) {
        console.log('Message sent successfully!');
        setMessage('');
      } else {
        console.log('Failed to send message:', response.data.error);
      }
    } catch (err) {
      console.log('Message send error:', {
        message: err.message,
        response: err.response?.data
      });
    }
  };

  const connectToSlack = async () => {
    setLoading(true);
    const redirectUri = chrome.identity.getRedirectURL('slack');

    const authUrl = `https://slack.com/oauth/v2/authorize?${new URLSearchParams({
      client_id: process.env.REACT_APP_SLACK_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'chat:write chat:write.public channels:join',
      response_type: 'code'
    })}`;

    try {
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, async (redirectUrl) => {
        if (chrome.runtime.lastError) {
          console.log('Auth error:', chrome.runtime.lastError);
          setLoading(false);
          return;
        }

        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        if (code) {
          await exchangeCodeForTokens(code);
          setIsConnected(true);
        }
        setLoading(false);
      });
    } catch (err) {
      console.log('Auth flow error:', err);
      setLoading(false);
    }
  };

  const exchangeCodeForTokens = async (code) => {
    const redirectUri = chrome.identity.getRedirectURL('slack');

    try {
      const response = await axios({
        method: 'post',
        url: 'https://slack.com/api/oauth.v2.access',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          client_id: process.env.REACT_APP_SLACK_CLIENT_ID,
          client_secret: process.env.REACT_APP_SLACK_CLIENT_SECRET,
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (response.data.ok) {
        await chrome.storage.local.set({ slackTokens: response.data });
        return response.data;
      }
    } catch (err) {
      console.log('Token exchange error:', {
        message: err.message,
        response: err.response?.data
      });
      throw err;
    }
  };

  const disconnectSlack = async () => {
    await chrome.storage.local.remove('slackTokens');
    setIsConnected(false);
    setMessage('');
  };

  return (
    <div className="pt-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <h1 className="text-lg font-semibold mb-2">Slack Manager</h1>
      <Button
        onClick={isConnected ? disconnectSlack : connectToSlack}
        disabled={loading}
        className={`w-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading ? 'Connecting...' : isConnected ? 'Disconnect Slack' : 'Connect to Slack'}
      </Button>

      {isConnected && (
        <div className="mt-4 space-y-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            className="w-full"
          />
          <Button
            onClick={sendMessage}
            disabled={!message}
            className="w-full"
          >
            Send Message
          </Button>
        </div>
      )}
    </div>
  );
};

export default SlackConnect;