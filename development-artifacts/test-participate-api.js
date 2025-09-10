const testParticipateAPI = async () => {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    involvementType: 'Mentor'
  };

  try {
    console.log('Testing participation API...');
    console.log('Test data:', testData);
    
    const response = await fetch('https://nestfestevent-cxwj520rg-abel-rincons-projects.vercel.app/api/participate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Message:', result.message);
    } else {
      console.log('❌ API test failed!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ API test failed with error!');
    console.error('Error:', error.message);
  }
};

testParticipateAPI();