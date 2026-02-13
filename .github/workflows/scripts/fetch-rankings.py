import requests
import json
from bs4 import BeautifulSoup

def fetch_owgr_rankings():
    """Fetch current OWGR rankings"""
    
    try:
        # Try OWGR official site
        url = "https://www.owgr.com/ranking"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Parse the rankings table
        rankings = []
        
        # Look for ranking rows - adjust selectors based on actual HTML structure
        rows = soup.find_all('tr', class_='ranking-row')  # Adjust this selector
        
        for row in rows[:50]:  # Get top 50
            try:
                name_element = row.find('td', class_='name') or row.find('a', class_='player-name')
                if name_element:
                    name = name_element.get_text(strip=True)
                    rankings.append(name)
            except Exception as e:
                print(f"Error parsing row: {e}")
                continue
        
        if len(rankings) >= 30:
            print(f"Successfully fetched {len(rankings)} rankings")
            return rankings
        
    except Exception as e:
        print(f"Error fetching from OWGR: {e}")
    
    # Fallback rankings if fetch fails
    print("Using fallback rankings")
    return [
        "Scottie Scheffler",
        "Rory McIlroy",
        "Justin Rose",
        "Tommy Fleetwood",
        "Chris Gotterup",
        "Russell Henley",
        "J.J. Spaun",
        "Robert MacIntyre",
        "Ben Griffin",
        "Xander Schauffele",
        "Hideki Matsuyama",
        "Justin Thomas",
        "Harris English",
        "Sepp Straka",
        "Viktor Hovland",
        "Alex Noren",
        "Patrick Reed",
        "Keegan Bradley",
        "Collin Morikawa",
        "Ludvig Aberg",
        "Cameron Young",
        "Maverick McNealy",
        "Matt Fitzpatrick",
        "Ryan Gerard",
        "Tyrrell Hatton",
        "Si Woo Kim",
        "Aaron Rai",
        "Sam Burns",
        "Shane Lowry",
        "Patrick Cantlay",
        "Marco Penge",
        "Corey Conners",
        "Bryson DeChambeau",
        "Jason Day",
        "Andrew Novak",
        "Matt McCarty",
        "Michael Brennan",
        "Kristoffer Reitan",
        "Samuel Stevens",
        "Rasmus Hojgaard",
        "Michael Kim",
        "Kurt Kitayama",
        "Michael Thorbjornsen",
        "Pierceson Coody",
        "Sami Valimaki",
        "Brian Harman",
        "Max Greyserman",
        "Akshay Bhatia",
        "Ryan Fox",
        "Nicolai Hojgaard"
    ]

def main():
    rankings = fetch_owgr_rankings()
    
    # Save to JSON file
    data = {
        "updated": requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC').json()['datetime'],
        "rankings": rankings
    }
    
    with open('rankings.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Rankings saved to rankings.json")

if __name__ == "__main__":
    main()
