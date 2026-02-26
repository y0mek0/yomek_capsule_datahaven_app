import { connect, disconnect, mintNFT, fetchInventory, getState } from './blockchain.js';

document.addEventListener('DOMContentLoaded', () => {
    // A simple regex for basic Ethereum address validation
    const isEthereumAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

    // --- UI Configuration ---
    const prizes = [
        { name: 'Cardano', image: 'assets/cardano.png', rarity: 'blue', rarityOrder: 1 },
        { name: 'BNB', image: 'assets/bnb.png', rarity: 'blue', rarityOrder: 1 },
        { name: 'Monero', image: 'assets/monero.png', rarity: 'blue', rarityOrder: 1 },
        { name: 'Solana', image: 'assets/solana.png', rarity: 'blue', rarityOrder: 1 },
        { name: 'TRON', image: 'assets/tron.png', rarity: 'blue', rarityOrder: 1 },
        { name: 'Ethereum', image: 'assets/ethereum.png', rarity: 'purple', rarityOrder: 2 },
        { name: 'Bitcoin Cash', image: 'assets/bitcoin-cash.png', rarity: 'purple', rarityOrder: 2 },
        { name: 'Bitcoin', image: 'assets/bitcoin.png', rarity: 'purple', rarityOrder: 2 },
        { name: 'Zcash', image: 'assets/zcash.png', rarity: 'purple', rarityOrder: 2 },
        { name: 'Tether', image: 'assets/tether.png', rarity: 'pink', rarityOrder: 3 },
        { name: 'USDC', image: 'assets/usdc.png', rarity: 'pink', rarityOrder: 3 },
        { name: 'Avalanche', image: 'assets/avalanche.png', rarity: 'pink', rarityOrder: 3 },
        { name: 'Litecoin', image: 'assets/litecoin.png', rarity: 'red', rarityOrder: 4 },
        { name: 'Zama', image: 'assets/zama.png', rarity: 'red', rarityOrder: 4 },
        { name: 'Stellar', image: 'assets/stellar.png', rarity: 'red', rarityOrder: 4 },
    ];
    const prizeMap = new Map(prizes.map(p => [p.name, p]));

    const rarityColors = {
        blue: '#2775CA',
        purple: '#6F4CFF',
        pink: '#FF55EC',
        red: '#E60000'
    };

    // --- DOM Elements ---
    const connectBtn = document.querySelector('.connect-btn');
    const userAddressSpan = document.getElementById('user-address');
    const openBtn = document.querySelector('.open-btn');
    const rouletteOverlay = document.getElementById('roulette-overlay');
    const reel = document.getElementById('roulette-reel');
    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerCard = document.getElementById('winner-card');
    const winnerImage = winnerCard.querySelector('img');
    const openAgainBtn = document.getElementById('open-again-btn');
    const closeWinnerBtn = document.getElementById('close-winner-btn');
    const capsuleNav = document.getElementById('capsule-nav');
    const inventoryNav = document.getElementById('inventory-nav');
    const mainSection = document.querySelector('main');
    const capsuleContentsSection = document.querySelector('.capsule-contents');
    const inventorySection = document.getElementById('inventory-section');
    const inventoryGrid = document.getElementById('inventory-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const addressInput = document.querySelector('.address-input');
    const goBtn = document.querySelector('.go-btn');
    const backBtn = document.querySelector('.back-btn');

    // --- UI State ---
    let isSpinning = false;
    let currentSort = 'newest';
    let displayedItems = [];
    let currentInventoryAddress = null;

    // --- UI Update Functions ---

    const updateConnectButton = (connectionState) => {
        if (connectionState.isConnected) {
            const address = connectionState.userAddress;
            userAddressSpan.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
            connectBtn.textContent = 'LOG OUT';
            openBtn.disabled = false;
        } else {
            userAddressSpan.textContent = '';
            connectBtn.textContent = 'CONNECT';
            openBtn.disabled = true;
        }
    };

    const showView = (view) => {
        mainSection.classList.toggle('hidden', view !== 'capsule');
        capsuleContentsSection.classList.toggle('hidden', view !== 'capsule');
        inventorySection.classList.toggle('hidden', view !== 'inventory');

        document.querySelector('nav a.active')?.classList.remove('active');
        if (view === 'capsule') {
            capsuleNav.classList.add('active');
        } else {
            inventoryNav.classList.add('active');
        }
    };

    const renderInventory = (items) => {
        displayedItems = items.map(item => {
            const prizeData = prizeMap.get(item.name) || { rarity: 'blue', rarityOrder: 1 };
            return { ...item, ...prizeData };
        });

        if (currentSort === 'newest') {
            displayedItems.sort((a, b) => b.timestamp - a.timestamp);
        } else if (currentSort === 'rarity') {
            displayedItems.sort((a, b) => b.rarityOrder - a.rarityOrder || b.timestamp - a.timestamp);
        }

        inventoryGrid.innerHTML = '';
        if (displayedItems.length === 0) {
            inventoryGrid.innerHTML = `<p class="empty-inventory-msg">This inventory is empty.</p>`;
            return;
        }

        displayedItems.forEach(item => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            gridItem.style.setProperty('--rarity-color', rarityColors[item.rarity]);
            gridItem.innerHTML = `
                <div class="item-number">#${String(item.mintNumber).padStart(5, '0')}</div>
                <img src="${item.image}" alt="${item.name}">
                <p>${item.name}</p>
                <span>${new Date(item.timestamp).toLocaleString()}</span>
            `;
            inventoryGrid.appendChild(gridItem);
        });
    };

    const loadAndRenderInventory = async (address) => {
        if (!address) return;
        inventoryGrid.innerHTML = `<p class="empty-inventory-msg">Loading...</p>`;
        currentInventoryAddress = address;

        const userState = getState();
        const isOwnInventory = userState.isConnected && userState.userAddress.toLowerCase() === address.toLowerCase();

        backBtn.classList.toggle('hidden', isOwnInventory);
        addressInput.value = isOwnInventory ? '' : address;
        addressInput.placeholder = isOwnInventory ? "Enter address" : "";

        const items = await fetchInventory(address);
        renderInventory(items);
    };

    // --- Roulette Animation ---
    const createRouletteItem = (prize) => {
        const item = document.createElement('div');
        item.className = 'roulette-item';
        item.dataset.rarity = prize.rarity;
        item.innerHTML = `
            <div class="roulette-item-card">
                <img src="${prize.image}" alt="${prize.name}">
                <span>${prize.name}</span>
            </div>
            <div class="roulette-rarity-bar" style="background-color: ${rarityColors[prize.rarity]};"></div>
        `;
        return item;
    };

    const startSpin = (winner) => {
        reel.innerHTML = '';
        reel.style.transition = 'none';
        reel.style.transform = 'translateX(0)';

        const reelItems = Array.from({ length: 100 }, () => prizes[Math.floor(Math.random() * prizes.length)]);
        reelItems[50] = winner;

        reelItems.forEach(prize => reel.appendChild(createRouletteItem(prize)));
        rouletteOverlay.classList.add('active');

        setTimeout(() => {
            reel.style.transition = 'transform 8s cubic-bezier(0.1, 0.5, 0.2, 1)';
            const itemTotalWidth = 220;
            const winnerCenterInReel = (50 * itemTotalWidth) + (itemTotalWidth / 2);
            const viewportCenter = rouletteOverlay.offsetWidth / 2;
            const finalTranslateX = viewportCenter - winnerCenterInReel;
            reel.style.transform = `translateX(${finalTranslateX}px)`;
        }, 100);

        reel.addEventListener('transitionend', () => {
            rouletteOverlay.classList.remove('active');
            showWinner(winner);
            isSpinning = false;
        }, { once: true });
    };

    const showWinner = (prize) => {
        winnerImage.src = prize.image;
        winnerImage.alt = prize.name;
        winnerCard.style.setProperty('--winner-glow-color', rarityColors[prize.rarity]);
        winnerOverlay.classList.add('active');
    };

    // --- Event Handlers ---
    const handleConnectClick = () => {
        const { isConnected } = getState();
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    const handleOpenCapsule = async () => {
        if (!getState().isConnected) return alert("Please connect your wallet first.");
        if (isSpinning) return;

        isSpinning = true;
        openBtn.disabled = true;
        openBtn.textContent = 'MINING...';

        const predeterminedWinner = prizes[Math.floor(Math.random() * prizes.length)];
        
        const metadata = {
            name: predeterminedWinner.name,
            image: predeterminedWinner.image, 
            timestamp: Date.now()
        };
        
        // Create a Base64 Data URI for the metadata
        const metadataJson = JSON.stringify(metadata);
        const metadataBase64 = btoa(metadataJson);
        const metadataUri = `data:application/json;base64,${metadataBase64}`;

        try {
            await mintNFT(metadataUri);
            startSpin(predeterminedWinner);
        } catch (error) {
            console.error("Minting process failed:", error);
            alert(error.message || "Minting failed. Please try again.");
            isSpinning = false;
        } finally {
            openBtn.disabled = false;
            openBtn.textContent = 'OPEN';
        }
    };

    // --- Initializer ---
    const initializeUI = () => {
        document.addEventListener('blockchainstatechange', (e) => {
            const connectionState = e.detail;
            updateConnectButton(connectionState);
            if (connectionState.isConnected) {
                // If we are in inventory view, refresh it for the new user
                if (!inventorySection.classList.contains('hidden')) {
                    loadAndRenderInventory(connectionState.userAddress);
                }
            } else {
                // If disconnected, clear inventory
                renderInventory([]);
            }
        });

        connectBtn.addEventListener('click', handleConnectClick);
        openBtn.addEventListener('click', handleOpenCapsule);

        openAgainBtn.addEventListener('click', () => {
            winnerOverlay.classList.remove('active');
            handleOpenCapsule();
        });
        closeWinnerBtn.addEventListener('click', () => winnerOverlay.classList.remove('active'));

        capsuleNav.addEventListener('click', (e) => { e.preventDefault(); showView('capsule'); });
        inventoryNav.addEventListener('click', (e) => {
            e.preventDefault();
            showView('inventory');
            const { userAddress } = getState();
            loadAndRenderInventory(userAddress);
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                renderInventory(displayedItems); // Re-render sorted items
            });
        });

        goBtn.addEventListener('click', () => {
            const address = addressInput.value.trim();
            if (isEthereumAddress(address)) { // Use the regex test here
                showView('inventory');
                loadAndRenderInventory(address);
            } else {
                alert('Please enter a valid Ethereum address.');
            }
        });

        backBtn.addEventListener('click', () => {
            const { userAddress } = getState();
            if (userAddress) {
                loadAndRenderInventory(userAddress);
            }
        });

        showView('capsule');
        document.querySelector('.filter-btn[data-sort="newest"]').classList.add('active');
        backBtn.classList.add('hidden');
        renderInventory([]);
    };

    initializeUI();
});
