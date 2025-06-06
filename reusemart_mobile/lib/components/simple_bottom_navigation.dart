import 'package:flutter/material.dart';

class SimpleBottomNavigation extends StatefulWidget {
  final List<BottomNavigationBarItem> navBarItems;
  final int initialIndex;
  final ValueChanged<int> onIndexChanged;

  const SimpleBottomNavigation({
    super.key,
    required this.navBarItems,
    this.initialIndex = 0,
    required this.onIndexChanged,
  });

  @override
  State<SimpleBottomNavigation> createState() => _SimpleBottomNavigationState();
}

class _SimpleBottomNavigationState extends State<SimpleBottomNavigation> {
  late int _selectedIndex;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: _selectedIndex,
      selectedItemColor: const Color(0xff198754),
      unselectedItemColor: const Color(0xff757575),
      type: BottomNavigationBarType.fixed,
      onTap: (index) {
        setState(() {
          _selectedIndex = index;
        });
        widget.onIndexChanged(index);
      },
      items: widget.navBarItems,
    );
  }
}   