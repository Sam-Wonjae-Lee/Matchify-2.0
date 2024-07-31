import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { Interface } from 'readline';


@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  // adds (user, blocked_user) to blocks table
  async blockUser(user: number, blocked_user: number) {
    console.log(process.env.DB_PASSWORD as string);
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'INSERT INTO blocks VALUES ($1, $2) RETURNING *',
        [user, blocked_user],
      );
      console.log(res.rows);
      return res;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // deletes (user, blocked_user) from blocks table
  async unblockUser(user: number, unblocked_user: number) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM blocks WHERE blocker = $1 AND blocked = $2 RETURNING *',
        [user, unblocked_user],
      );
      console.log(res.rows);
      return res;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // message use case
  async add_message(
    messageID: number,
    userID: number,
    threadID: number,
    content: string,
  ) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'INSERT INTO message VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [messageID, userID, threadID, content],
      );
      console.log(res.rows);
      return res;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // removes message from thread
  async remove_message(messageID: number) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM message WHERE messageID = $1 RETURNING *',
        [messageID],
      );
      console.log(res.rows);
      return res;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // sends friend request
  async send_friend_request(senderID: number, receiverID: number) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'INSERT INTO friendrequest VALUES ($1, $2) RETURNING *',
        [senderID, receiverID],
      );
      console.log(res.rows);
      return res;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // adds sender to receiver's friend list and remove the request from the inbox
  async acceptFriendRequest(receiver_id: number, sender_id: number) {
    console.log(process.env.DB_PASSWORD as string);
    const client = await this.pool.connect();
    try {
      const insertFriend = await client.query(
        'INSERT INTO friendlist (receiver_id, sender_id) VALUES ($1, $2) RETURNING *',
        [receiver_id, sender_id]
      );
      console.log(insertFriend.rows);
      const deleteRequest = await client.query(
        'DELETE FROM inbox WHERE receiver_id = $1 AND sender_id = $2 RETURNING *',
        [receiver_id, sender_id]
      );
      console.log(deleteRequest.rows);
      return {
        insertFriend,
        deleteRequest,
      };
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  // remove sender's request from receiver's inbox
  async declineFriendRequest(receiver_id: number, sender_id: number) {
    console.log(process.env.DB_PASSWORD as string);
    const client = await this.pool.connect();
    try {
      const deleteRequest = await client.query(
        'DELETE FROM inbox WHERE receiver_id = $1 AND sender_id = $2 RETURNING *',
        [receiver_id, sender_id]
      );
      console.log(deleteRequest.rows);
      return {
        deleteRequest,
      };
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }
    async unsend_friend_request(senderID: number, receiverID: number) {
        const client = await this.pool.connect();
        try {
            const res = await client.query("DELETE FROM friendrequest WHERE senderID = $1 AND receiverID = $2 RETURNING *", [senderID, receiverID]);
            console.log(res.rows);
        return res;
        } 
        catch (e) {
            console.log(e);
        } 
        finally {
            client.release();
        }
    }



    // adds upcoming concert to the database
    async update_concerts(concert_list: {
        concert_id: string;
        name: string;
        location: string;
        url: string;
        date: string;
        image: string;
        venue: string;
    }[]) {
        const client = await this.pool.connect();
        try {
            for (let concert of concert_list) {
                const res = await client.query("INSERT INTO concerts VALUES ($1, $2, $3, $4, $5, $6, *7) RETURNING *", [concert.concert_id, concert.name, concert.location, 
                  concert.url, concert.image, concert.venue, concert.date]);

                console.log(concert);
            }
              // const res = await client.query("INSERT INTO concerts VALUES ($1, $2, $3, $4) RETURNING *", [concertID, concertName, concertDate, concertLocation]);
              // console.log(res.rows);
        // return res;
        } 
        catch (e) {
            console.log(e);
        } 
        finally {
            client.release();
        }
    }


    // delete concerts with dates before the current
    async delete_old_concerts() {
        const client = await this.pool.connect();
        try {
            const res = await client.query("DELETE FROM concerts WHERE date < NOW() RETURNING *");
            return res;
        } 
        catch (e) {
            console.log(e);
        } 
        finally {
            client.release();
        }
    }

}
