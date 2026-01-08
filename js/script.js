function initMap() {
  const cityCenter = {
    lat: 28.6139,
    lng: 77.2090 // New Delhi
  };

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: cityCenter
  });

  const issues = [
    { lat: 28.6200, lng: 77.2100, status: "Reported" },
    { lat: 28.6100, lng: 77.2200, status: "In Progress" },
    { lat: 28.6000, lng: 77.2000, status: "Resolved" }
  ];

  issues.forEach(issue => {
    let color;

    if (issue.status === "Reported") color = "yellow";
    else if (issue.status === "In Progress") color = "blue";
    else color = "green";

    new google.maps.Marker({
      position: { lat: issue.lat, lng: issue.lng },
      map: map,
      title: issue.status,
      icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
    });
  });
}
