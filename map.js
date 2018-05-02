function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 3.139, lng: 101.687 },
    zoom: 11
  })

  var directionsDisplay = new google.maps.DirectionsRenderer({ map })

  var directionsService = new google.maps.DirectionsService()

  var distanceMatrixService = new google.maps.DistanceMatrixService()

  var points = []
  var marker
  var optimum = 0

  map.addListener('click', ({ latLng }) => {
    points = [...points, latLng]
    points.length <= 1
      ? setMarker(latLng)
      : fetchDistanceMatrix(points, dists =>
          fetchOptimumPaths(dists)
            .then(paths => drawOptimumRoutes(paths))
            .then(() => removeMarker())
        )
  })

  function setMarker(latLng) {
    marker = new google.maps.Marker({
      map: map,
      position: latLng,
      title: `Start`
    })
  }

  function fetchDistanceMatrix(points, fn) {
    document.getElementById('map').classList.add('loader')
    distanceMatrixService.getDistanceMatrix(
      {
        origins: points,
        destinations: points,
        travelMode: 'DRIVING'
      },
      res =>
        fn(
          res.rows.map(row =>
            row.elements.map(element => element.distance.value)
          )
        )
    )
  }

  function fetchOptimumPaths(dists) {
    return fetch('https://enigmatic-inlet-62173.herokuapp.com/hk', {
      body: JSON.stringify({ dists }),
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST'
    })
      .then(res => res.json())
      .then(res => {
        optimum = res.optimum
        return res.path
      })
  }

  function drawOptimumRoutes(paths) {
    var request = {
      destination: points[paths[paths.length - 1] - 1],
      origin: points[paths[0] - 1],
      waypoints: paths
        .slice(1, paths.length - 1)
        .map(po => ({ location: points[po - 1], stopover: true })),
      travelMode: 'DRIVING'
    }

    directionsService.route(request, function(response, status) {
      if (status == 'OK') {
        directionsDisplay.setDirections(response)
        document.getElementById('map').classList.remove('loader')
      }
    })

    return
  }

  function removeMarker() {
    marker.setMap(null)
  }
}
