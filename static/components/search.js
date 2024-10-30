export default {
    data() {
      return {
        searchQuery: '',
        bookResults: [],
        sectionResults: [],
        error: '',
        resultMessage: '',
        user_role:''
      };
    },
    created(){
        this.user_role =  localStorage.getItem('user_role');
    },
    methods: {
      search() {
        if (!this.searchQuery) {
          this.resultMessage = 'Please enter a search query';
          return;
        }
        
        fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(this.searchQuery)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.books && data.sections) {
            this.bookResults = data.books;
            this.sectionResults = data.sections;
            this.resultMessage = '';
          } else {
            this.resultMessage = 'No results found';
          }
        })
        .catch(error => {
          this.resultMessage = 'Failed to fetch search results';
          console.log(error);
        });
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; text-align: center;">
  <!-- Search Input and Button -->
  <div style="margin-bottom: 20px;">
    <input v-model="searchQuery" placeholder="Search for books or sections" style="padding: 10px; width: 60%; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
    <button @click="search" style="background-color: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Search</button>
  </div>
  
  <!-- Result Message -->
  <p style="color: #ff0000;">{{ resultMessage }}</p>

  <p v-if="bookResults.length === 0 && sectionResults.length === 0" style="color: #333; font-weight: bold; margin-top: 20px;">
    No Results
  </p>

  <!-- Book Results -->
  <div v-if="bookResults.length > 0" style="margin-top: 20px;">
    <h2 style="color: #333; margin-bottom: 10px;">Books</h2>
    <div v-for="book in bookResults" :key="book.bookname" style="margin-bottom: 10px;">
      <div v-if="user_role=='librarian'">
        <router-link :to="'/lbook/'+book.book_id" style="text-decoration: none; color: #555;">{{ book.bookname }}</router-link>
      </div>
      <div v-if="user_role=='user'">
        <router-link :to="'/book/'+book.book_id" style="text-decoration: none; color: #555;">{{ book.bookname }}</router-link>
      </div>
    </div>
  </div>

  <!-- Section Results -->
  <div v-if="sectionResults.length > 0" style="margin-top: 20px;">
    <h2 style="color: #333; margin-bottom: 10px;">Sections</h2>
    <div v-for="section in sectionResults" :key="section.section_name" style="margin-bottom: 10px;">
      <div v-if="user_role=='librarian'">
        <router-link :to="'/lsection/'+section.section_id" style="text-decoration: none; color: #555;">{{ section.section_name }}</router-link>
      </div>
      <div v-if="user_role=='user'">
        <router-link :to="'/section/'+section.section_id" style="text-decoration: none; color: #555;">{{ section.section_name }}</router-link>
      </div>
    </div><br>
  </div><br><br><br>
  <div v-if="user_role=='librarian'">
      <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
    </div>
    <div v-if="user_role=='user'">
      <router-link to="/feed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
    </div>
</div>

    `
  }
  