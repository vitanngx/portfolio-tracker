import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, PieChart, Users, Calendar, MessageCircle, Target, Download, Bell, Wifi, WifiOff } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVC4gUFwG5eX11_Vn0UgNEYDEYW4ofMUs",
  authDomain: "tanyoko-portfolio.firebaseapp.com",
  projectId: "tanyoko-portfolio",
  storageBucket: "tanyoko-portfolio.firebasestorage.app",
  messagingSenderId: "825604572010",
  appId: "1:825604572010:web:9a0d09c6a851a062dfdb13",
  measurementId: "G-RKSW9JWN47"
};

// Firebase Service Implementation
const FirebaseService = {
  // Real Firebase functions using Firestore REST API
  saveToFirebase: async (collection, data) => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/main`;
      
      const firestoreData = {
        fields: {
          data: {
            stringValue: JSON.stringify(data)
          },
          timestamp: {
            timestampValue: new Date().toISOString()
          }
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error saving ${collection} to Firebase:`, error);
      throw error;
    }
  },
  
  loadFromFirebase: async (collection) => {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/main`;
      
      const response = await fetch(url);
      
      if (response.status === 404) {
        // Document doesn't exist yet
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.fields && result.fields.data && result.fields.data.stringValue) {
        return JSON.parse(result.fields.data.stringValue);
      }
      
      return null;
    } catch (error) {
      console.error(`Error loading ${collection} from Firebase:`, error);
      // Fallback to localStorage
      const localData = localStorage.getItem(`portfolio${collection}`);
      return localData ? JSON.parse(localData) : null;
    }
  },
  
  subscribeToChanges: (collection, callback) => {
    console.log(`Setting up real-time listener for ${collection}`);
    
    // Poll for changes every 10 seconds (simple implementation)
    const interval = setInterval(async () => {
      try {
        const data = await FirebaseService.loadFromFirebase(collection);
        if (data) {
          callback(data);
        }
      } catch (error) {
        console.error(`Error in real-time listener for ${collection}:`, error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }
};

const PortfolioTracker = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Load data từ Firebase hoặc localStorage
  const [investments, setInvestments] = useState(() => {
    const savedInvestments = localStorage.getItem('portfolioInvestments');
    return savedInvestments ? JSON.parse(savedInvestments) : [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        category: 'Cổ phiếu',
        quantity: 10,
        buyPrice: 150,
        currentPrice: 175,
        buyDate: '2024-01-15',
        owner: 'Tan',
        notes: 'Cổ phiếu ổn định, triển vọng tốt'
      },
      {
        id: 2,
        symbol: 'BTC-USD',
        name: 'Bitcoin',
        category: 'Crypto',
        quantity: 0.5,
        buyPrice: 45000,
        currentPrice: 52000,
        buyDate: '2024-02-01',
        owner: 'Yoko-chan',
        notes: 'Đầu tư dài hạn'
      }
    ];
  });

  const [contributions, setContributions] = useState(() => {
    const savedContributions = localStorage.getItem('portfolioContributions');
    return savedContributions ? JSON.parse(savedContributions) : [
      { name: 'Tan', amount: 5000, percentage: 60 },
      { name: 'Yoko-chan', amount: 3333, percentage: 40 }
    ];
  });

  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem('portfolioGoals');
    return savedGoals ? JSON.parse(savedGoals) : [
      { id: 1, title: 'Tiết kiệm $10,000 trong 1 năm', target: 10000, current: 8333, deadline: '2024-12-31' }
    ];
  });

  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    name: '',
    category: 'Cổ phiếu',
    quantity: '',
    buyPrice: '',
    owner: 'Tan'
  });

  const [newContribution, setNewContribution] = useState({
    name: 'Tan',
    amount: ''
  });

  // Sync data với Firebase
  const syncToFirebase = async (dataType, data) => {
    try {
      setIsSyncing(true);
      await FirebaseService.saveToFirebase(dataType, data);
      console.log(`✅ Synced ${dataType} to Firebase`);
    } catch (error) {
      console.error(`❌ Failed to sync ${dataType}:`, error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load data từ Firebase khi khởi động
  useEffect(() => {
    const loadFromFirebase = async () => {
      try {
        console.log('🔥 Loading data from Firebase...');
        const [firebaseInvestments, firebaseContributions, firebaseGoals] = await Promise.all([
          FirebaseService.loadFromFirebase('investments'),
          FirebaseService.loadFromFirebase('contributions'),
          FirebaseService.loadFromFirebase('goals')
        ]);

        if (firebaseInvestments) {
          console.log('✅ Loaded investments from Firebase:', firebaseInvestments);
          setInvestments(firebaseInvestments);
        }
        if (firebaseContributions) {
          console.log('✅ Loaded contributions from Firebase:', firebaseContributions);
          setContributions(firebaseContributions);
        }
        if (firebaseGoals) {
          console.log('✅ Loaded goals from Firebase:', firebaseGoals);
          setGoals(firebaseGoals);
        }
        
        setIsOnline(true);
        console.log('🌐 Successfully connected to Firebase!');
      } catch (error) {
        console.error('❌ Failed to load from Firebase:', error);
        setIsOnline(false);
      }
    };

    loadFromFirebase();

    // Subscribe to real-time changes
    const unsubscribeInvestments = FirebaseService.subscribeToChanges('investments', (data) => {
      console.log('🔄 Real-time update - investments:', data);
      if (data && JSON.stringify(data) !== JSON.stringify(investments)) {
        setInvestments(data);
      }
    });
    
    const unsubscribeContributions = FirebaseService.subscribeToChanges('contributions', (data) => {
      console.log('🔄 Real-time update - contributions:', data);
      if (data && JSON.stringify(data) !== JSON.stringify(contributions)) {
        setContributions(data);
      }
    });
    
    const unsubscribeGoals = FirebaseService.subscribeToChanges('goals', (data) => {
      console.log('🔄 Real-time update - goals:', data);
      if (data && JSON.stringify(data) !== JSON.stringify(goals)) {
        setGoals(data);
      }
    });

    return () => {
      unsubscribeInvestments();
      unsubscribeContributions();
      unsubscribeGoals();
    };
  }, []);

  // Lưu data vào localStorage và Firebase mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('portfolioInvestments', JSON.stringify(investments));
    syncToFirebase('investments', investments);
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('portfolioContributions', JSON.stringify(contributions));
    syncToFirebase('contributions', contributions);
  }, [contributions]);

  useEffect(() => {
    localStorage.setItem('portfolioGoals', JSON.stringify(goals));
    syncToFirebase('goals', goals);
  }, [goals]);

  // Hàm lấy giá thực từ Yahoo Finance API với error handling tốt hơn
  const fetchRealPrice = async (symbol) => {
    try {
      console.log(`Fetching price for symbol: ${symbol}`);
      
      // Thử nhiều endpoint khác nhau
      const endpoints = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!response.ok) {
            console.log(`HTTP error! status: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`Response for ${symbol}:`, data);
          
          if (data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta) {
            const price = data.chart.result[0].meta.regularMarketPrice || 
                         data.chart.result[0].meta.previousClose ||
                         data.chart.result[0].meta.chartPreviousClose;
            
            if (price) {
              console.log(`Successfully fetched price for ${symbol}: ${price}`);
              return parseFloat(price);
            }
          }
        } catch (endpointError) {
          console.log(`Endpoint failed:`, endpointError);
          continue;
        }
      }
      
      console.log(`No price found for ${symbol}`);
      return null;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  };

  // Hàm cập nhật giá tất cả đầu tư
  const updateAllPrices = async () => {
    console.log('Đang cập nhật giá...'); // Debug log
    const updatedInvestments = await Promise.all(
      investments.map(async (inv) => {
        console.log(`Fetching price for ${inv.symbol}...`); // Debug log
        const newPrice = await fetchRealPrice(inv.symbol);
        console.log(`${inv.symbol}: ${newPrice}`); // Debug log
        return {
          ...inv,
          currentPrice: newPrice || inv.currentPrice,
          lastUpdated: new Date().toLocaleTimeString() // Thêm timestamp
        };
      })
    );
    setInvestments(updatedInvestments);
    console.log('Cập nhật giá hoàn tất!'); // Debug log
  };

  // Tự động cập nhật giá mỗi 5 phút (giảm tần suất để tránh rate limit)
  useEffect(() => {
    if (investments.length > 0) {
      const interval = setInterval(() => {
        updateAllPrices();
      }, 300000); // 5 phút
      return () => clearInterval(interval);
    }
  }, [investments.length]); // Chỉ dependency trên length, không phải toàn bộ array

  // Tính toán tổng giá trị portfolio
  const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
  const totalCost = investments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = ((totalGainLoss / totalCost) * 100).toFixed(2);

  // Dữ liệu cho biểu đồ phân bổ với màu pastel
  const pieData = investments.map((inv, index) => ({
    name: inv.symbol,
    value: inv.quantity * inv.currentPrice,
    fill: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD1DC'][index % 5]
  }));

  // Dữ liệu mẫu cho biểu đồ tăng trưởng
  const growthData = [
    { date: '2024-01', value: 7500 },
    { date: '2024-02', value: 8100 },
    { date: '2024-03', value: 7800 },
    { date: '2024-04', value: 8500 },
    { date: '2024-05', value: 8333 }
  ];

  const addInvestment = () => {
    if (newInvestment.symbol && newInvestment.quantity && newInvestment.buyPrice) {
      const investment = {
        id: Date.now(),
        ...newInvestment,
        quantity: parseFloat(newInvestment.quantity),
        buyPrice: parseFloat(newInvestment.buyPrice),
        currentPrice: parseFloat(newInvestment.buyPrice) * (1 + (Math.random() - 0.5) * 0.2), // Giá ngẫu nhiên
        buyDate: new Date().toISOString().split('T')[0],
        notes: ''
      };
      setInvestments([...investments, investment]);
      setNewInvestment({
        symbol: '',
        name: '',
        category: 'Cổ phiếu',
        quantity: '',
        buyPrice: '',
        owner: 'Bạn'
      });
    }
  };

  const resetContributions = () => {
    const resetContribs = contributions.map(contrib => ({
      ...contrib,
      amount: 0,
      percentage: 0
    }));
    setContributions(resetContribs);
  };

  const addContribution = () => {
    if (newContribution.amount) {
      const amount = parseFloat(newContribution.amount);
      const updatedContributions = contributions.map(c => 
        c.name === newContribution.name 
          ? { ...c, amount: c.amount + amount }
          : c
      );
      
      const total = updatedContributions.reduce((sum, c) => sum + c.amount, 0);
      updatedContributions.forEach(c => {
        c.percentage = ((c.amount / total) * 100).toFixed(1);
      });
      
      setContributions(updatedContributions);
      setNewContribution({ name: 'Bạn', amount: '' });
    }
  };

  const deleteInvestment = (id) => {
    setInvestments(investments.filter(inv => inv.id !== id));
  };

  const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD1DC'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Portfolio Tracker</h1>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-gray-600">Quản lý đầu tư thông minh cho cặp đôi</p>
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="text-green-500" size={16} />
              ) : (
                <WifiOff className="text-red-500" size={16} />
              )}
              <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {isSyncing && (
                <span className="text-xs text-blue-500 animate-pulse">Syncing...</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center mb-8 bg-white/70 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: PieChart },
            { id: 'investments', label: 'Đầu tư', icon: TrendingUp },
            { id: 'contributions', label: 'Vốn góp', icon: Users },
            { id: 'goals', label: 'Mục tiêu', icon: Target }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-rose-100 text-rose-700 shadow-md border border-rose-200'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Tổng giá trị</p>
                    <p className="text-gray-800 text-2xl font-bold">${totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="text-blue-400" size={32} />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Lãi/Lỗ</p>
                    <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${totalGainLoss.toLocaleString()}
                    </p>
                  </div>
                  {totalGainLoss >= 0 ? 
                    <TrendingUp className="text-emerald-400" size={32} /> : 
                    <TrendingDown className="text-rose-400" size={32} />
                  }
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">% Lãi/Lỗ</p>
                    <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {totalGainLossPercent}%
                    </p>
                  </div>
                  <PieChart className="text-purple-400" size={32} />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Số tài sản</p>
                    <p className="text-gray-800 text-2xl font-bold">{investments.length}</p>
                  </div>
                  <Target className="text-orange-400" size={32} />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 text-xl font-semibold">Phân bổ tài sản</h3>
                  <button
                    onClick={() => {
                      console.log('Nút cập nhật được click!');
                      updateAllPrices();
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-1 rounded-lg text-sm transition-colors"
                  >
                    🔄 Cập nhật giá
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Giá trị']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Growth Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-gray-800 text-xl font-semibold mb-4">Tăng trưởng theo thời gian</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#F472B6" strokeWidth={3} dot={{ fill: '#F472B6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="space-y-8">
            {/* Add Investment Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-gray-800 text-xl font-semibold mb-4">Thêm đầu tư mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <input
                  type="text"
                  placeholder="Mã (AAPL, BTC...)"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.symbol}
                  onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                />
                <input
                  type="text"
                  placeholder="Tên tài sản"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                />
                <select
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.category}
                  onChange={(e) => setNewInvestment({ ...newInvestment, category: e.target.value })}
                >
                  <option value="Cổ phiếu">Cổ phiếu</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Trái phiếu">Trái phiếu</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                </select>
                <input
                  type="number"
                  placeholder="Số lượng"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.quantity}
                  onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Giá mua"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.buyPrice}
                  onChange={(e) => setNewInvestment({ ...newInvestment, buyPrice: e.target.value })}
                />
                <select
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={newInvestment.owner}
                  onChange={(e) => setNewInvestment({ ...newInvestment, owner: e.target.value })}
                >
                  <option value="Tan">Tan</option>
                  <option value="Yoko-chan">Yoko-chan</option>
                </select>
              </div>
              <button
                onClick={addInvestment}
                className="mt-4 bg-gradient-to-r from-pink-300 to-purple-300 hover:from-pink-400 hover:to-purple-400 text-gray-700 px-6 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md"
              >
                <PlusCircle size={20} />
                <span>Thêm đầu tư</span>
              </button>
            </div>

            {/* Investments List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 text-xl font-semibold">Danh sách đầu tư</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem('portfolioInvestments');
                      localStorage.removeItem('portfolioContributions');
                      localStorage.removeItem('portfolioGoals');
                      // Also reset Firebase data
                      syncToFirebase('investments', []);
                      syncToFirebase('contributions', []);
                      syncToFirebase('goals', []);
                      window.location.reload();
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                  >
                    <span>🗑️</span>
                    <span>Reset All Data</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Nút cập nhật trong bảng được click!');
                      updateAllPrices();
                    }}
                    className="bg-green-100 hover:bg-green-200 text-green-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                  >
                    <span>🔄</span>
                    <span>Cập nhật giá</span>
                  </button>
                  <button className="text-blue-500 hover:text-blue-600 flex items-center space-x-2 transition-colors">
                    <Download size={20} />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-gray-600 py-3 font-medium">Mã</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Tên</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Loại</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Số lượng</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Giá mua</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Giá hiện tại</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Lãi/Lỗ</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map(inv => {
                      const gainLoss = (inv.currentPrice - inv.buyPrice) * inv.quantity;
                      const gainLossPercent = ((inv.currentPrice - inv.buyPrice) / inv.buyPrice * 100).toFixed(2);
                      return (
                        <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="text-gray-800 py-4 font-medium">{inv.symbol}</td>
                          <td className="text-gray-700 py-4">{inv.name}</td>
                          <td className="text-gray-600 py-4">{inv.category}</td>
                          <td className="text-gray-700 py-4">{inv.quantity}</td>
                          <td className="text-gray-700 py-4">${inv.buyPrice}</td>
                          <td className="text-gray-700 py-4">${inv.currentPrice.toFixed(2)}</td>
                          <td className={`py-4 font-medium ${gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${gainLoss.toFixed(2)} ({gainLossPercent}%)
                          </td>
                          <td className="py-4">
                            <button
                              onClick={() => deleteInvestment(inv.id)}
                              className="text-rose-500 hover:text-rose-600 text-sm transition-colors"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-8">
            {/* Add Contribution */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 text-xl font-semibold">Thêm vốn góp</h3>
                <button
                  onClick={resetContributions}
                  className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Reset vốn góp</span>
                </button>
              </div>
              <div className="flex gap-4">
                <select
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={newContribution.name}
                  onChange={(e) => setNewContribution({ ...newContribution, name: e.target.value })}
                >
                  <option value="Tan">Tan</option>
                  <option value="Yoko-chan">Yoko-chan</option>
                </select>
                <input
                  type="number"
                  placeholder="Số tiền"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={newContribution.amount}
                  onChange={(e) => setNewContribution({ ...newContribution, amount: e.target.value })}
                />
                <button
                  onClick={addContribution}
                  className="bg-gradient-to-r from-blue-300 to-indigo-300 hover:from-blue-400 hover:to-indigo-400 text-gray-700 px-6 py-2 rounded-lg transition-all shadow-md"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Contributions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {contributions.map(contrib => (
                <div key={contrib.name} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-800 text-lg font-semibold">{contrib.name}</h4>
                    <Users className="text-blue-400" size={24} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền đóng góp:</span>
                      <span className="text-gray-800 font-medium">${contrib.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ sở hữu:</span>
                      <span className="text-gray-800 font-medium">{contrib.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all"
                        style={{ width: `${contrib.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-8">
            {/* Goals List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-gray-800 text-xl font-semibold mb-4">Mục tiêu tài chính</h3>
              <div className="space-y-4">
                {goals.map(goal => {
                  const progress = (goal.current / goal.target * 100).toFixed(1);
                  return (
                    <div key={goal.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-800 font-medium">{goal.title}</h4>
                        <span className="text-gray-600 text-sm flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {goal.deadline}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Tiến độ: {progress}%</span>
                        <span className="text-gray-800">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-blue-400 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 text-center">
                <MessageCircle className="text-blue-400 mx-auto mb-3" size={32} />
                <h4 className="text-gray-800 font-medium mb-2">Ghi chú đầu tư</h4>
                <p className="text-gray-600 text-sm">Thêm ghi chú cho từng khoản đầu tư</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 text-center">
                <Bell className="text-orange-400 mx-auto mb-3" size={32} />
                <h4 className="text-gray-800 font-medium mb-2">Thông báo</h4>
                <p className="text-gray-600 text-sm">Cảnh báo thay đổi giá</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 text-center">
                <Download className="text-emerald-400 mx-auto mb-3" size={32} />
                <h4 className="text-gray-800 font-medium mb-2">Báo cáo</h4>
                <p className="text-gray-600 text-sm">Xuất báo cáo PDF/Excel</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioTracker;