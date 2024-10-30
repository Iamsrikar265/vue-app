export default {
    data() {
      return {
        sectionDetails: {
          section_name: '',
          s_description: '',
          s_image: null,
          s_date: '',
          books: []
        },
        allBooks: [],
      availableBooks: [],
      selectedBook: null,
        error: ''
      };
    },
    created() {
        this.sectionID=this.$route.params.sectionID;
      this.fetchSection(this.sectionID);
      this.fetchBooks();
      console.log(this.sectionID);
      
    },
    methods: {
      fetchSection(sectionID){
        console.log(this.sectionID);
        fetch(`http://127.0.0.1:5000/api/section/${sectionID}`,{
        method:'GET',
        headers:{
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(response => response.json())
      .then(data => {
        this.sectionDetails = data;
      })
      .catch(error => {
        if (error.message === '404') {
          this.resultMessage = 'Section not found'
        } else {
          this.resultMessage = 'Failed to fetch section details';
          console.log(error);
      }
    });
},
fetchBooks() {
  fetch(`http://127.0.0.1:5000/api/books`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => response.json())
    .then(data => {
      this.allBooks = data;
      this.filterAvailableBooks();
    })
    .catch(error => {
      this.error = 'Failed to fetch books';
      console.log(error);
    });
},
filterAvailableBooks() {
  if (this.allBooks.length && this.sectionDetails.books.length) {
    const sectionBookIds = this.sectionDetails.books.map(book => book.book_id);
    this.availableBooks = this.allBooks.filter(book => !sectionBookIds.includes(book.book_id));
  } else {
    this.availableBooks = this.allBooks;
  }
},
    },
    template: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <!-- Header -->
  <div style="text-align: center; padding: 20px; background-color: #d7c0d0; border: 3px solid #000;">
    <h1 style="color: #000; margin: 0; padding: 10px 0; font-family: cursive;">Section Details</h1>
  </div>

  <!-- Main Content -->
  <div style="max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
    <!-- Section Name and Description -->
    <div style="margin-bottom: 20px;">
      <h2 style="margin-bottom: 10px; color: #333;">{{ sectionDetails.section_name }}</h2>
      <p><strong>Description:</strong> {{ sectionDetails.s_description }}</p>
      <img :src="sectionDetails.s_image" alt="Section Image" width="100" style="max-width: 100%; height: auto; margin-bottom: 10px;">
    </div>

    <!-- Books in Section -->
    <div style="margin-bottom: 20px;">
      <h2 style="margin-bottom: 20px; color: #333;">Books Available in the Section:</h2>
      <ul>
        <li v-for="book in sectionDetails.books" :key="book.book_id">
          <router-link :to="'/book/' + book.book_id" style="color: #007bff; text-decoration: none;">{{ book.bookname }}</router-link>
        </li>
      </ul>
    </div>

    <!-- Section Date -->
    <div style="margin-bottom: 20px;">
      <p><strong>Date:</strong> {{ sectionDetails.s_date }}</p>
      <p v-if="error" style="color: red;">{{ error }}</p>
    </div>
  </div><br>
  <router-link to="/feed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
</div>

    `
  };
  