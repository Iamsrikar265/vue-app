export default {
    props: ['bookID', 'feedbacks'],
    data() {
      return {
        feedbackText: '',
        resultMessage: ''
      };
    },
    created(){
        this.bookID = this.$route.params.bookID;
    },
    methods: {
      submitFeedback() {
        fetch(`http://127.0.0.1:5000/api/book/${this.bookID}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ feedback_text: this.feedbackText })
        })
        .then(response => response.json())
        .then(data => {
          this.resultMessage = data.message;
          this.$emit('feedback-submitted');
          this.feedbackText = '';
          window.location.href='/feed'
        })
        .catch(error => {
          this.resultMessage = 'Failed to submit feedback';
          console.log(error);
        });
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; max-width: 600px; margin: 0 auto; text-align: center;">
  <!-- Feedback Heading -->
  <h3 style="color: #333; margin-bottom: 20px;">Submit Feedback</h3>

  <!-- Feedback Textarea -->
  <textarea v-model="feedbackText" placeholder="Write your feedback" 
            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; margin-bottom: 20px; height: 150px;"></textarea>
  
  <!-- Submit Button -->
  <button @click="submitFeedback" 
          style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Submit Feedback</button><br><br>
  <router-link to="/feed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
  
  <!-- Result Message -->
  <p style="color: #333; margin-top: 20px;">{{ resultMessage }}</p>
</div>

    `
  }
  