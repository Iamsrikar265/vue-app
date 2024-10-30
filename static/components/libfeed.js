export default {
    data() {
      return {
        books: [],
        sections: [],
        requests: [],
        resultMessage: ''
      };
    },
    methods: {
      grantRequest(requestId) {
        fetch(`http://127.0.0.1:5000/api/grantbookrequest/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.resultMessage = data.message;
          this.fetchData();  // Refresh data after granting the request
        })
        .catch(error => {
          this.resultMessage = 'Failed to grant request';
          console.log(error);
        });
      },
      revokeRequest(requestId) {
        fetch(`http://127.0.0.1:5000/api/revokebookrequest/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.resultMessage = data.message;
          this.fetchData();  // Refresh data after revoking the request
        })
        .catch(error => {
          this.resultMessage = 'Failed to revoke request';
          console.log(error);
        });
      },
      rejectRequest(requestId) {
        fetch(`http://127.0.0.1:5000/api/rejectbookrequest/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.resultMessage = data.message;
          this.fetchData();  // Refresh data after rejecting the request
        })
        .catch(error => {
          this.resultMessage = 'Failed to reject request';
          console.log(error);
        });
      },
      fetchData() {
        fetch('http://127.0.0.1:5000/api/libfeed', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.books = data.books;
          this.sections = data.sections;
          this.requests = data.requests;
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
      }
    },
    created() {
      this.fetchData();
    },
    template: `
      <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <header style="background-color: #333; color: #fff; padding: 10px; text-align: center;">
    <h1>Librarian's Feed</h1>
  </header>
  
  <div style="display: flex; justify-content: space-between; margin: 20px;">
    <!-- Left Column -->
    <div style="width: calc(33.33% - 10px); padding: 10px; background-color: #fff; box-sizing: border-box;">
      <router-link to="/search" style="text-decoration: none;">
        <button style="background-color: #007bff; color: #fff; border: 1px solid #000; cursor: pointer; padding: 5px 10px; border-radius: 3px; font-size: 14px;">Search the Library</button>
      </router-link>
      
      <h3>Requests and Activities</h3>
      <div v-for="request in requests" :key="request.request_id" style="margin-bottom: 10px;">
        <p v-if="request.status === 'requested'">{{ request.username }} requested the book, {{ request.bookname }}</p>
        <p v-if="request.status === 'granted'">{{ request.username }} received the book, {{ request.bookname }}</p>
        <button v-if="request.status === 'requested'" @click="grantRequest(request.request_id)" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 5px 10px; border-radius: 3px; font-size: 14px; cursor: pointer;">Grant</button>
        <button v-if="request.status === 'requested'" @click="rejectRequest(request.request_id)" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 5px 10px; border-radius: 3px; font-size: 14px; cursor: pointer;">Reject</button>
        <button v-if="request.status === 'granted'" @click="revokeRequest(request.request_id)" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 5px 10px; border-radius: 3px; font-size: 14px; cursor: pointer;">Revoke</button>
      </div><br><br>
      
      <div class="links-section">
        <router-link to="/addbook" style="text-decoration: none; color: #555;">Add a Book</router-link><br><br><br>
        <router-link to="/addsection" style="text-decoration: none; color: #555;">Add a Section</router-link><br><br><br>
        <router-link to="/statspage" style="text-decoration: none; color: #555;">Library Statistics</router-link><br><br><br>
        <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
      </div>
    </div>
    
    <!-- Middle Column (Books) -->
    <div style="width: calc(33.33% - 10px); padding: 10px; background-color: #6ea5ad19; box-sizing: border-box;">
      <h3>All Books</h3>
      <div v-for="book in books" :key="book.title" style="margin-bottom: 10px;">
        <h3>{{ book.title }}</h3>
        <img :src="book.image" alt="Book Image" width="100" style="max-width: 100px; height: auto;">
        <p>{{ book.description }}</p>
        <p><strong>Author:</strong> {{ book.author }}</p>
        <router-link :to="'/lbook/' + book.book_id" style="text-decoration: none; color: #007bff;">View Book</router-link>
      </div>
    </div>
    
    <!-- Right Column (Sections) -->
    <div style="width: calc(33.33% - 10px); padding: 10px; background-color: #6ea5ad19; box-sizing: border-box;">
      <h3>All Sections</h3>
      <div v-for="section in sections" :key="section.s_title" style="margin-bottom: 10px;">
        <h3>{{ section.s_title }}</h3>
        <img :src="section.s_image" alt="Section Image" width="100" style="max-width: 100px; height: auto;">
        <p>{{ section.s_description }}</p>
        <router-link :to="'/lsection/' + section.section_id" style="text-decoration: none; color: #007bff;">View Section</router-link>
      </div>
    </div>
  </div>
  
  <p>{{ resultMessage }}</p>
</div>

    `
  }
  