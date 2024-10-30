export default {
  data() {
    return {
      bookDetails: {
        book_id:null,
        bookname: '',
        author: '',
        description: '',
        image: null,
        file_path: null,
        date: '',
        request_status: '',
        feedbacks: []
      },
      feedbackText: '',
      error: '',
      resultMessage: ''
    };
  },
  created() {
    this.bookID = this.$route.params.bookID;
    this.fetchBook(this.bookID);
  },
  methods: {
    fetchBook(bookID) {
      fetch(`http://127.0.0.1:5000/api/book/${bookID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(response => response.json())
      .then(data => {
        this.bookDetails = data;
      })
      .catch(error => {
        this.resultMessage = 'Failed to fetch book details';
        console.log(error);
      });
    },
    requestBook() {
      fetch(`http://127.0.0.1:5000/api/book/${this.bookID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(response => response.json())
      .then(data => {
        this.resultMessage = data.message;
        this.fetchBook(this.bookID);  // Refresh the book details to update the request status
      })
      .catch(error => {
        this.resultMessage = 'Failed to complete the action';
        console.log(error);
      });
    }
  },
  template: `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
  <!-- Header -->
  <div style="text-align: center; padding: 20px; background-color: #d7c0d0; border: 3px solid #000;">
    <h1 style="color: #000; margin: 0; padding: 10px 0; font-family: cursive;">Book Details</h1>
  </div>

  <div style="display: flex; justify-content: space-between; padding: 20px;">
    <!-- Left Section -->
    <div style="flex: 1; padding-right: 20px;">
      <h3>Description</h3>
      <p>{{ bookDetails.description }}</p>
      <div v-if="bookDetails.request_status === 'granted'">
        <a :href="bookDetails.file_path" target="_blank" style="text-decoration: none; color: #007bff;">View Content</a>
        <button @click="requestBook" style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Return Book</button>
        <div>
          <router-link :to="'/book/' + bookDetails.book_id + '/feedback'" style="text-decoration: none; color: #555;">Give Feedback</router-link>
        </div>
      </div>
      <div v-else-if="bookDetails.request_status === 'requested'">
        <button @click="requestBook" style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cancel Request</button>
      </div>
      <div v-else>
        <button @click="requestBook" style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Request Book</button>
      </div><br><br>
      <router-link to="/feed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br><br>

      <p>{{ resultMessage }}</p>
    </div>

    <!-- Middle Section -->
    <div style="flex: 1; padding: 0 20px; text-align: center;">
      <h3>{{ bookDetails.bookname }}</h3>
      <img :src="bookDetails.image" alt="Book Image" width="100">
      <p><strong>Author:</strong> {{ bookDetails.author }}</p>
      <p><strong>Date:</strong> {{ bookDetails.date }}</p>
      <p v-if="error">{{ error }}</p>
    </div>

    <!-- Right Section -->
    <div style="flex: 1; padding-left: 20px;">
      <div v-if="bookDetails.feedbacks.length > 0">
        <h3>Feedbacks</h3>
        <ul>
          <li v-for="feedback in bookDetails.feedbacks" :key="feedback.feedback_date" style="margin-bottom: 10px;">
            <p>{{ feedback.feedback_text }}</p>
            <small>{{ feedback.feedback_date }}</small>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

  `
}
