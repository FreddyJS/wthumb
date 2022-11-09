set -e

BLUE_COLOR='\033[0;34m'
RESET_COLOR='\033[0m'

# Check if running as root
if [ "$(id -u)" != "0" ]; then
    echo "This script must be run as root" 1>&2
    exit 1
fi

# Install Node.js
echo ""
echo "${BLUE_COLOR}Installing Node.js...${RESET_COLOR}"
apt-get install -y nodejs npm
npm install -g n
n stable

# Install Yarn
echo ""
echo "${BLUE_COLOR}Installing Yarn...${RESET_COLOR}"
npm install --global yarn

# Setup the emulator development environment
echo ""
echo "${BLUE_COLOR}Setting up the emulator development environment...${RESET_COLOR}"
cd emulator
apt-get install -y gcc-arm-linux-gnueabihf
yarn install

echo ""
echo "${BLUE_COLOR}Running the emulator tests...${RESET_COLOR}"
./test.sh
cd ..

# Setup the web development environment
echo ""
echo "${BLUE_COLOR}Setting up the web development environment...${RESET_COLOR}"
cd frontend
yarn install
cd ..
