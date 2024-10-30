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
      error: '',
      resultMessage: ''
    };
  },
  created() {
    this.sectionID = this.$route.params.sectionID;
    this.fetchSectionDetails(this.sectionID);
    this.fetchBooks();
  },
  methods: {
    fetchSectionDetails(sectionID) {
      fetch(`http://127.0.0.1:5000/api/lsection/${sectionID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(response => response.json())
        .then(data => {
          this.sectionDetails = data;
          this.filterAvailableBooks();
        })
        .catch(error => {
          this.error = 'Failed to fetch section details';
          console.log(error);
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
    addBookToSection() {
      fetch(`http://127.0.0.1:5000/api/addbooktosection/${this.sectionID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ book_id: this.selectedBook })
      })
        .then(response => response.json())
        .then(data => {
          this.resultMessage = data.message;
          this.fetchSectionDetails(this.sectionID); // Refresh the section details to show the updated list of books
        })
        .catch(error => {
          this.resultMessage = 'Failed to add book to section';
          console.log(error);
        });
    },
    deleteSection() {
      const token = localStorage.getItem('token');
      if (token) {
        const confirmation = confirm(`Section ${this.sectionDetails.section_name} will be deleted. Proceed?`);
        if (confirmation) {
          fetch(`http://127.0.0.1:5000/api/lsection/${this.sectionID}`, {
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
              alert('Section not found');
            } else {
              alert('Failed to delete section');
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
  template: `
    <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h1 style="margin-top: 0;">{{ sectionDetails.section_name }}</h1>
    
    <p><strong>Description:</strong> {{ sectionDetails.s_description }}</p>
    <img :src="sectionDetails.s_image" alt="Section Image" width="100" style="display: block; margin: 10px 0;">
    <p><strong>Date:</strong> {{ sectionDetails.s_date }}</p>
    <p v-if="error" style="color: #dc3545;">{{ error }}</p>

    <div style="margin-top: 20px;">
        <h2>Books Available in the Section:</h2>
        <ul style="list-style-type: none; padding: 0;">
            <li v-for="book in sectionDetails.books" :key="book.book_id" style="margin-bottom: 10px;">
                <router-link :to="'/lbook/'+book.book_id" style="text-decoration: none; color: #007bff;">{{ book.bookname }}</router-link>
            </li>
        </ul>
    </div>
    
    <div style="margin-top: 20px;">
        <label for="book-select" style="display: block; margin-bottom: 5px; font-weight: bold;">Select a book:</label>
        <select id="book-select" v-model="selectedBook" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; margin-bottom: 10px;">
            <option v-for="book in availableBooks" :value="book.book_id">{{ book.bookname }}</option>
        </select>
        <button @click="addBookToSection" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer;">Add Book to Section</button>
        <router-link :to="'/editsection/' + sectionID" style="text-decoration: none; color: #007bff; display: block; margin-top: 10px;">Edit Section</router-link>
        <button @click="deleteSection" style="background-color: #dc3545; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer; margin-top: 10px;">Delete Section</button>
    </div>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
    <p style="margin-top: 20px; color: #007bff;">{{ resultMessage }}</p>
</div>

  `
};
