export default {
  data() {
    return {
      bookDetails: {
        bookname: '',
        author: '',
        description: '',
        image: null,
        file_path: null,
        date: '',
        feedbacks:[]
      },
      feedbackText: '',
      error: ''
    };
  },
  created() {
      this.bookID=this.$route.params.bookID;
    this.fetchBook(this.bookID);
    console.log(this.bookID);
    
  },
  methods: {
    fetchBook(bookID){
      console.log(this.bookID);
      fetch(`http://127.0.0.1:5000/api/lbook/${bookID}`,{
      method:'GET',
      headers:{
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      this.bookDetails = data;
    })
    .catch(error => {
      if (error.message === '404') {
        this.resultMessage = 'Book not found'
      } else {
        this.resultMessage = 'Failed to fetch book details';
        console.log(error);
    }
  });
},
deleteBook() {
  const token = localStorage.getItem('token');
  if (token) {
    const confirmation = confirm(`Book ${this.bookDetails.bookname} will be deleted. Proceed?`);
    if (confirmation) {
      fetch(`http://127.0.0.1:5000/api/lbook/${this.bookID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(data => {
        alert(data.message);
        window.location.href='/libfeed'
      })
      .catch(error => {
        if (error.message === '404') {
          alert('Book not found');
        } else {
          alert('Failed to delete book');
          console.log(error);
        }
      });
    }
  }
  else{
    alert('Please log in to access this page');
  }
}

  },
  template:
  `
  <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
  <h1 style="margin-top: 0;">{{ bookDetails.bookname }}</h1>
  <p><strong>Author:</strong> {{ bookDetails.author }}</p>
  <p><strong>Description:</strong> {{ bookDetails.description }}</p>
  <img :src="bookDetails.image" alt="Book Image" width="100" style="max-width: 100px; height: auto; display: block; margin-bottom: 10px;">
  <p><strong>Date:</strong> {{ bookDetails.date }}</p>
  <a :href="bookDetails.file_path" download style="text-decoration: none; color: #007bff; font-weight: bold;">View Content</a><br><br>
  
  <div v-if="bookDetails.feedbacks.length > 0" style="margin-top: 20px;">
    <h3>User Feedbacks</h3>
    <ul style="list-style-type: none; padding-left: 0;">
      <li v-for="feedback in bookDetails.feedbacks" :key="feedback.feedback_date" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <p style="margin: 0;">{{ feedback.feedback_text }}</p>
        <small style="color: #888;">{{ feedback.feedback_date }}</small>
      </li>
    </ul>
  </div>
  
  <div style="margin-top: 20px;">
    <router-link :to="'/editbook/' + bookID" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Edit Book</router-link>
    <button @click="deleteBook" style="background-color: #dc3545; color: #fff; border: 1px solid #000; padding: 5px 10px; border-radius: 3px; font-size: 14px; cursor: pointer;">Delete Book</button>
  </div>
  <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link>
  <p v-if="error" style="color: #dc3545; margin-top: 20px;">{{ error }}</p>
</div>

  ` 
  
};