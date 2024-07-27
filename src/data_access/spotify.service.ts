import { Injectable, HttpException } from '@nestjs/common';

@Injectable()
export class SpotifyService {
  private clientID: string;
  private clientSecret: string;
  private redirectURI: string;

  constructor() {
    this.clientID = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectURI = process.env.SPOTIFY_REDIRECT_URI;
  }

  /**
   * Retrieves the access token. The access token is a string which contains the credentials and permissions that can be used to access resources.
   * The access token is valid for 1 hour. After that time, the token expires and you need to request a new one.
   * More info is located here: https://developer.spotify.com/documentation/web-api/concepts/access-token
   *
   * @return Temporary access token in JSON Format
   */

  private async getAccessToken(): Promise<string> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',   // For creating resources
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(this.clientID + ':' + this.clientSecret).toString('base64')),
      },
    });

    if (!response.ok) {
      throw new HttpException('Failed to retrieve access token', response.status);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Retrieves the URL for Spotify Authorization. The URL is used to gain access to the user's Spotify account and retrieve userID.
   * @returns URL for Spotify Authorization
   */
  public getAuthUrl(): string {
    const scope = 'user-read-private user-read-email'; // Permissions for authorization
    const authURL = `https://accounts.spotify.com/authorize?client_id=${this.clientID}
                      &redirect_uri=${encodeURIComponent(this.redirectURI)}&scope=${encodeURIComponent(scope)}
                      &response_type=code`;
    return authURL;
  }

  public async getUserInfo(userId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`https://api.spotify.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new HttpException('Failed to retrieve user info', response.status);
    }

    return response.json();
  }

  public async getUserPlaylists(userId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
        throw new HttpException('Failed to retrieve playlist info', response.status);
    }
  
    return response.json();
  }


}