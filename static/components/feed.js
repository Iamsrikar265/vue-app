export default {
    data() {
        return {
            books: [],
            sections:[],
            grantedBooks: []
        };
    },
    template: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <!-- Header -->
  <div style="text-align: center; padding: 20px; background-color: #d7c0d0; border: 3px solid #000;">
    <h1 style="color: #000; margin: 0; padding: 10px 0; font-family: cursive;">User's Feed Page</h1>
  </div>

  <div style="display: flex; margin-top: 20px;">
    <!-- Left Side -->
    <div style="width: 20%; padding: 20px; background-color: #f5f5f5;">
      <router-link to="/search" style="display: block; margin-bottom: 10px;">
        <button style="background-color: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Search the Library
        </button>
      </router-link>
      <router-link to="/profile" style="display: block; text-decoration: none; color: #555; margin-bottom: 10px;">
        My Profile
      </router-link>
      <router-link to="/logout" style="display: block; text-decoration: none; color: #555; margin-bottom: 10px;">
        Logout
      </router-link>
    </div>

    <!-- Middle Section (All Books) -->
    <div style="width: 50%; padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h3>All Books</h3>
      <div v-for="book in books" :key="book.title" class="book-item" style="margin-bottom: 20px;">
        <h3>{{ book.title }}</h3>
        <img :src="book.image" alt="Book Image" width="100">
        <p>{{ book.description }}</p>
        <p><strong>Author:</strong> {{ book.author }}</p>
        <router-link :to="'/book/' + book.book_id" style="text-decoration: none; color: #555;">
          View Book
        </router-link>
      </div>
    </div>

    <!-- Right Side (All Sections and My Books) -->
    <div style="width: 30%; padding: 20px;">
      <h3>All Sections</h3>
      <div v-for="section in sections" :key="section.s_title" class="book-item" style="margin-bottom: 20px;">
        <h3>{{ section.s_title }}</h3>
        <img :src="section.s_image" alt="Section Image" width="100">
        <p>{{ section.s_description }}</p>
        <router-link :to="'/section/' + section.section_id" style="text-decoration: none; color: #007bff;">
          View Section
        </router-link>
      </div>
      <h3>My Books</h3>
      <div v-if="grantedBooks.length > 0">
        <ul>
          <li v-for="book in grantedBooks" :key="book.book_id">
            <router-link :to="'/book/' + book.book_id" style="text-decoration: none; color: #555;">
              {{ book.title }}
            </router-link>
          </li>
        </ul>
      </div>
      <p v-else>No books granted</p>
    </div>
  </div>
</div>

    `,
    created() {
        fetch('http://127.0.0.1:5000/api/feed', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.books = data.books;
            this.sections=data.sections;
            this.grantedBooks = data.granted_books;
        })
        .catch(error => {
            console.error('Error fetching books:', error);
        });
    }
}
